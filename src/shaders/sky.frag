// Adventure sky — one continuous world whose biome palette is blended on the
// JS side and painted here: gradient sky, fBm nebula, twinkling stars, a
// celestial body, drifting aurora, three parallax ridgelines with haze.

out vec4 fragColor;

varying vec2 vNdc;

uniform vec2 uRes;
uniform float uTime;
uniform float uScroll;
uniform vec2 uMouse;

uniform vec3 skyTop;
uniform vec3 skyBot;
uniform vec3 nebA;
uniform vec3 nebB;
uniform vec3 glow;
uniform vec3 star;
uniform vec3 ridgeTint;
uniform float starAmt;
uniform float moonAmt;
uniform float auroraAmt;
uniform float haze;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += amp * vnoise(p);
    p = m * p;
    amp *= 0.5;
  }
  return v;
}

vec3 ridge(vec3 col, vec2 uv, float seed, float px, float freq, float base,
           float amp, vec3 tint, float haze) {
  float x = uv.x * freq + seed + px;
  float h = base + amp * (fbm(vec2(x, seed)) - 0.5)
            + amp * 0.55 * (fbm(vec2(x * 3.1, seed * 2.0)) - 0.5);
  float d = uv.y - h;
  vec3 c = mix(col, tint, smoothstep(0.008, -0.008, d));
  // haze pooling along the ridgeline
  c = mix(c, glow, exp(-abs(d) * 20.0) * haze * smoothstep(-0.12, 0.06, d));
  return c;
}

void main() {
  vec2 uv = vNdc;
  float t = uTime;
  float aspect = uRes.x / uRes.y;
  float drift = uScroll * 1.6;

  // ── sky gradient ────────────────────────────────────────────
  vec3 col = mix(skyBot, skyTop, smoothstep(-0.55, 0.75, uv.y));

  // ── nebula ──────────────────────────────────────────────────
  float n1 = fbm(uv * 1.4 + vec2(t * 0.012 + drift * 0.15, 0.0)
                 + fbm(uv * 0.6 - t * 0.006) * 0.3);
  col = mix(col, nebA, smoothstep(0.34, 0.92, n1) * 0.55);
  float n2 = fbm(uv * 2.2 - vec2(t * 0.02, t * 0.008) + drift * 0.1);
  col = mix(col, nebB, smoothstep(0.44, 0.98, n2) * 0.35);

  // ── aurora bands ────────────────────────────────────────────
  float band = fbm(vec2(uv.x * 1.1 + t * 0.03, 0.6)) - 0.5;
  float ay = uv.y - (0.16 + band * 0.34);
  float aur = exp(-ay * ay * 13.0) * exp(-abs(uv.x) * 0.35);
  col += glow * auroraAmt * aur
         * (0.55 + 0.45 * sin(t * 0.8 + uv.x * 3.0)) * 0.9;

  // ── stars ───────────────────────────────────────────────────
  vec2 sp = uv * vec2(aspect, 1.0) * 22.0 + vec2(drift * 0.25, 0.0);
  vec2 cell = floor(sp);
  float h = hash21(cell);
  if (h > 1.0 - starAmt) {
    vec2 pos = fract(sp) - vec2(hash21(cell + 7.1), hash21(cell + 3.7));
    float d = length(pos);
    float tw = 0.55 + 0.45 * sin(t * (2.0 + h * 9.0) + h * 60.0);
    col += star * smoothstep(0.14, 0.0, d) * tw * (0.35 + h);
  }

  // ── celestial body ──────────────────────────────────────────
  vec2 mp = vec2(0.52, 0.36) + uMouse * 0.015 + vec2(drift * 0.06, 0.0);
  float md = length((uv - mp) * vec2(aspect, 1.0));
  col += glow * moonAmt * exp(-md * md * 26.0) * 0.45;
  col += glow * moonAmt * smoothstep(0.088, 0.078, md) * 0.85;

  // ── ridgelines, back to front ───────────────────────────────
  vec3 ridgeBack = mix(skyBot, ridgeTint, 0.45);
  vec3 ridgeMid = mix(skyBot, ridgeTint, 0.72);
  col = ridge(col, uv, 0.0, uMouse.x * 0.025 + drift, 1.3, -0.26, 0.34,
              ridgeBack, haze);
  col = ridge(col, uv, 7.7, uMouse.x * 0.055 + drift * 1.6, 2.1, -0.47, 0.30,
              ridgeMid, haze * 0.75);
  col = ridge(col, uv, 13.3, uMouse.x * 0.11 + drift * 2.4, 3.0, -0.72, 0.26,
              ridgeTint, haze * 0.5);

  // ── ground breath near the bottom edge ──────────────────────
  col += glow * exp((uv.y + 0.95) * -6.0) * 0.05;

  // ── vignette + dither ───────────────────────────────────────
  vec2 vq = uv * vec2(0.72, 1.0);
  col *= 1.0 - 0.34 * dot(vq, vq);
  col += (hash21(gl_FragCoord.xy + fract(t)) - 0.5) * (2.0 / 255.0);

  fragColor = vec4(col, 1.0);
}
