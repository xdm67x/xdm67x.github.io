out vec4 fragColor;

uniform vec3 uColor;
uniform float uOpacity;

varying float vTw;
varying float vSeed;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float a = smoothstep(0.5, 0.08, d);
  fragColor = vec4(uColor * (0.7 + 0.6 * vSeed), a * vTw * uOpacity);
}
