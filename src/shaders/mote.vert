// Drifting motes: stars, embers, petals — palette set from JS per biome.

attribute vec3 aSeed;

uniform float uTime;
uniform float uScroll;
uniform float uDpr;
uniform vec2 uMouse;

varying float vTw;
varying float vSeed;

void main() {
  vec2 p = position.xy;
  p.y = mod(p.y + uTime * (0.008 + aSeed.x * 0.022) + uScroll * aSeed.z * 0.35
            + 10.0, 2.6) - 1.3;
  p.x += sin(uTime * 0.25 + aSeed.y * 6.2831) * 0.045;
  p += uMouse * (aSeed.z * 0.05);

  vTw = 0.5 + 0.5 * sin(uTime * (1.0 + aSeed.x * 4.0) + aSeed.y * 40.0);
  vSeed = aSeed.x;

  gl_Position = vec4(p, 0.0, 1.0);
  gl_PointSize = (2.0 + aSeed.y * 5.0) * uDpr;
}
