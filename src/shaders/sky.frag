// A living silk field: domain-warped fBm flowing slowly behind the content.
// Palettes are blended per section on the JS side; the field drifts with the
// pointer, travels with the scroll, and its breath quickens with scroll
// velocity (time is accumulated faster on the JS side).

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
uniform float glowAmt;

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
  for (int i = 0; i < 4; i++) {
    v += amp * vnoise(p);
    p = m * p;
    amp *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vNdc;
  float t = uTime;

  // ── silk: domain-warped fbm, drifting with the journey ──────
  vec2 p = uv * 1.9 + vec2(uScroll * 0.7, uScroll * 0.25);
  vec2 q = vec2(
    fbm(p + t * 0.05),
    fbm(p + vec2(5.2, 1.3) - t * 0.04)
  );
  vec2 r = vec2(
    fbm(p + 2.2 * q + vec2(1.7, 9.2) + t * 0.06),
    fbm(p + 2.2 * q + vec2(8.3, 2.8) - t * 0.05)
  );
  float f = fbm(p + 2.4 * r);

  vec3 col = mix(skyBot, skyTop, clamp(f * f * 2.4, 0.0, 1.0));
  col = mix(col, nebA, clamp(length(q) * 0.85, 0.0, 1.0) * 0.55);
  col = mix(col, nebB, clamp(r.x * r.x * 1.6, 0.0, 1.0) * 0.45);

  // ── breathing glow, wandering with the pointer ─────────────
  vec2 gp = vec2(sin(t * 0.06) * 0.45, 0.24 + cos(t * 0.045) * 0.18)
             + uMouse * 0.06;
  float gd = length(uv - gp);
  col += glow * glowAmt * (exp(-gd * gd * 5.5) * 0.16 + exp(-gd * 1.8) * 0.08);

  // ── vignette + dither ───────────────────────────────────────
  vec2 vq = uv * vec2(0.72, 1.0);
  col *= 1.0 - 0.3 * dot(vq, vq);
  col += (hash21(gl_FragCoord.xy + fract(t)) - 0.5) * (2.0 / 255.0);

  fragColor = vec4(col, 1.0);
}
