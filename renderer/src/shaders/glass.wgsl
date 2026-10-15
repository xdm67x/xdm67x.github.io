// Glass shader: the world as a pile of translucent panes over a film.
//
//   vs_main  + fs_solid -> the core and the rings (opaque, depth writing)
//   vs_main  + fs_glass -> the plates (blended, sorted back to front)
//
// One vertex entry point serves both so the instance buffer is shared.
// Colour is authored and shaded in linear light; the sRGB encode happens once,
// at the very end, and only if the surface is a linear format (params.w).
// Alpha is premultiplied everywhere, because the canvas composites over the
// <video> behind it.

struct Globals {
  view_proj: mat4x4<f32>,
  inv_view_proj: mat4x4<f32>,
  cam_pos: vec4<f32>,
  cam_right: vec4<f32>,
  cam_up: vec4<f32>,
  key_dir: vec4<f32>,
  key_color: vec4<f32>,    // rgb, intensity
  fill_dir: vec4<f32>,
  fill_color: vec4<f32>,   // rgb, intensity
  ambient: vec4<f32>,      // rgb, intensity
  accent: vec4<f32>,       // rgb, glow strength
  tint: vec4<f32>,         // rgb, exposure
  params: vec4<f32>,       // time, transition burst, debug, 1 = encode sRGB
};

@group(0) @binding(0) var<uniform> G: Globals;

struct VsIn {
  @location(0) pos: vec3<f32>,
  @location(1) nrm: vec3<f32>,
  @location(2) vcol: vec4<f32>,
  @location(3) uv: vec2<f32>,
  @location(4) m0: vec4<f32>,
  @location(5) m1: vec4<f32>,
  @location(6) m2: vec4<f32>,
  @location(7) m3: vec4<f32>,
  @location(8) n0: vec4<f32>,
  @location(9) n1: vec4<f32>,
  @location(10) n2: vec4<f32>,
  @location(11) icol: vec4<f32>,
  @location(12) iprm: vec4<f32>,   // kind, burst, billboard size, seed
};

struct VsOut {
  @builtin(position) clip: vec4<f32>,
  @location(0) wpos: vec3<f32>,
  @location(1) wnrm: vec3<f32>,
  @location(2) col: vec4<f32>,
  @location(3) burst: f32,
  @location(4) seed: f32,
};

fn srgb_to_linear(c: vec3<f32>) -> vec3<f32> {
  let lo = c / 12.92;
  let hi = pow(max((c + vec3<f32>(0.055)) / 1.055, vec3<f32>(0.0)), vec3<f32>(2.4));
  return select(hi, lo, c <= vec3<f32>(0.04045));
}

fn linear_to_srgb(c: vec3<f32>) -> vec3<f32> {
  let lo = c * 12.92;
  let hi = 1.055 * pow(max(c, vec3<f32>(0.0)), vec3<f32>(1.0 / 2.4)) - 0.055;
  return select(hi, lo, c <= vec3<f32>(0.0031308));
}

/// Filmic shoulder: keeps the specular highlights from clipping to flat white.
fn tonemap(c: vec3<f32>) -> vec3<f32> {
  let x = max(c, vec3<f32>(0.0)) * G.tint.a;
  return (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14);
}

/// Encode once, at the end, in display space.
fn encode(c: vec3<f32>) -> vec3<f32> {
  if (G.params.w > 0.5) {
    return linear_to_srgb(c);
  }
  return c;
}

@vertex
fn vs_main(in: VsIn) -> VsOut {
  let m = mat4x4<f32>(in.m0, in.m1, in.m2, in.m3);
  let world = (m * vec4<f32>(in.pos, 1.0)).xyz;
  let nrm = normalize(mat3x3<f32>(in.n0.xyz, in.n1.xyz, in.n2.xyz) * in.nrm);

  var out: VsOut;
  out.clip = G.view_proj * vec4<f32>(world, 1.0);
  out.wpos = world;
  out.wnrm = nrm;
  out.col = vec4<f32>(in.icol.rgb, in.icol.a * in.vcol.a);
  out.burst = in.iprm.y;
  out.seed = in.iprm.w;
  return out;
}

// ------------------------------------------------------------------- lighting

fn distance_fade(dist: f32) -> f32 {
  // Near pieces are dissolved before they can smear across the frame, far
  // pieces dissolve back into the film.
  let near = smoothstep(0.26, 0.85, dist);
  let far = exp(-(dist * 0.085) * (dist * 0.085));
  return near * far;
}

/// A cheap environment: the glass picks up the room's colour by the direction
/// it reflects, which is what makes a stack of panes read as depth instead of
/// as flat blue.
fn environment(n: vec3<f32>, v: vec3<f32>) -> vec3<f32> {
  let r = reflect(-v, n);
  let up = r.y * 0.5 + 0.5;
  let horizon = exp(-abs(r.y) * 2.4);
  let base = mix(G.tint.rgb * 1.35, G.accent.rgb * 0.55 + G.tint.rgb * 0.6, up);
  return base + G.accent.rgb * horizon * 0.16;
}

// ----------------------------------------------------------------------- solid

@fragment
fn fs_solid(in: VsOut) -> @location(0) vec4<f32> {
  let n = normalize(in.wnrm);
  let v = normalize(G.cam_pos.xyz - in.wpos);
  let l = normalize(G.key_dir.xyz);
  let albedo = srgb_to_linear(in.col.rgb);

  let ndl = clamp(dot(n, l), 0.0, 1.0);
  let key = G.key_color.rgb * G.key_color.a * ndl;
  let ambient = G.ambient.rgb * G.ambient.a * (0.55 + 0.45 * (n.y * 0.5 + 0.5));

  let h = normalize(l + v);
  let spec = pow(clamp(dot(n, h), 0.0, 1.0), 96.0) * 1.7 * G.key_color.a;

  let f = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 3.0);
  let rim = G.accent.rgb * f * (0.30 + 1.1 * in.burst);

  let debug = G.params.z;
  if (debug > 0.5 && debug < 1.5) {
    return vec4<f32>(encode(albedo), 1.0);
  }

  let colour = albedo * (key + ambient)
    + G.key_color.rgb * spec
    + environment(n, v) * f * 0.55
    + rim
    + G.accent.rgb * in.burst * 0.9;

  return vec4<f32>(encode(tonemap(colour)), 1.0);
}

// ----------------------------------------------------------------------- glass

@fragment
fn fs_glass(in: VsOut) -> @location(0) vec4<f32> {
  let n = normalize(in.wnrm);
  let v = normalize(G.cam_pos.xyz - in.wpos);
  let l = normalize(G.key_dir.xyz);
  let albedo = srgb_to_linear(in.col.rgb);

  let dist = distance(in.wpos, G.cam_pos.xyz);
  let fade = distance_fade(dist);

  let ndl = clamp(dot(n, l), 0.0, 1.0);
  let h = normalize(l + v);
  let f = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 3.2);

  // Edges are denser than faces: a pane seen edge-on is nearly solid, and a
  // pane seen straight through is nearly clear.
  let spec = pow(clamp(dot(n, h), 0.0, 1.0), 150.0) * 2.4 * G.key_color.a;
  let glow = G.accent.rgb * (0.05 + 1.45 * in.burst) * G.accent.a;

  let key = G.key_color.rgb * G.key_color.a * (0.16 + 0.84 * ndl * ndl);
  let ambient = G.ambient.rgb * G.ambient.a * 0.85;

  let colour = albedo * (ambient + key * 0.55)
    + environment(n, v) * f * 0.75
    + G.key_color.rgb * spec
    + glow * (0.35 + f);

  // Per-piece variation, so 172 identical plates do not read as a pattern, and
  // a low ceiling: stacked panes add light, they do not black the film out.
  let alpha = in.col.a * (0.30 + 0.75 * f) * (0.82 + 0.36 * in.seed) * fade;

  let clipped = clamp(alpha, 0.0, 0.62);
  return vec4<f32>(encode(tonemap(colour)) * clipped, clipped);
}

// ------------------------------------------------------------------------ end
