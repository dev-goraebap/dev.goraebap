import { useEffect, useRef } from "react";

const VERTEX_SHADER = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uPointer;
uniform vec3 uBackground;
uniform vec3 uLine;
out vec4 outColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p = p * 2.02 + vec2(11.3, 7.1);
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / min(uResolution.x, uResolution.y);
  float dist = length(uv);
  float drift = fbm(uv * 1.35 + vec2(uTime * 0.028, -uTime * 0.019));
  vec2 toPointer = uv - uPointer;
  float swell = exp(-dot(toPointer, toPointer) * 7.0) * 0.22;
  float height = (dist * 4.6 + drift * 2.4 + swell) * 2.1;
  float line = abs(fract(height) - 0.5) / max(fwidth(height), 0.0001);
  float stroke = 1.0 - smoothstep(0.35, 1.25, line);
  float clearing = smoothstep(0.17, 0.46, dist);
  float falloff = 1.0 - smoothstep(0.58, 1.18, dist);
  float strength = stroke * clearing * falloff * (0.2 + swell * 1.6);
  outColor = vec4(mix(uBackground, uLine, strength), 1.0);
}`;

const MAX_PIXEL_RATIO = 1.5;

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

// oklch, color-mix 같은 토큰 값도 셰이더가 쓸 수 있도록 실제 픽셀 색으로 변환한다.
function readColor(token: string): [number, number, number] {
  const probe = document.createElement("canvas");
  probe.width = 1;
  probe.height = 1;
  const context = probe.getContext("2d", { willReadFrequently: true });
  if (!context) return [0, 0, 0];
  context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  context.fillRect(0, 0, 1, 1);
  const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
  return [red / 255, green / 255, blue / 255];
}

export function LineFieldCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl2", { antialias: false, alpha: false });
    if (!canvas || !gl) return;

    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
      resolution: gl.getUniformLocation(program, "uResolution"),
      time: gl.getUniformLocation(program, "uTime"),
      pointer: gl.getUniformLocation(program, "uPointer"),
      background: gl.getUniformLocation(program, "uBackground"),
      line: gl.getUniformLocation(program, "uLine"),
    };

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = { x: 0.45, y: 0.3 };
    const pointer = { ...target };
    const startedAt = performance.now();
    let frame = 0;

    function draw(now: number) {
      pointer.x += (target.x - pointer.x) * 0.05;
      pointer.y += (target.y - pointer.y) * 0.05;
      gl!.uniform1f(uniforms.time, reducedMotion ? 12 : (now - startedAt) / 1000);
      gl!.uniform2f(uniforms.pointer, pointer.x, pointer.y);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
      if (!reducedMotion) frame = requestAnimationFrame(draw);
    }

    function redraw() {
      if (reducedMotion) draw(startedAt);
    }

    function applyColors() {
      gl!.uniform3fv(uniforms.background, readColor("--background"));
      gl!.uniform3fv(uniforms.line, readColor("--foreground"));
      redraw();
    }

    function resize() {
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
      canvas!.width = Math.round(canvas!.clientWidth * ratio);
      canvas!.height = Math.round(canvas!.clientHeight * ratio);
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
      gl!.uniform2f(uniforms.resolution, canvas!.width, canvas!.height);
      redraw();
    }

    function movePointer(event: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      const scale = Math.min(rect.width, rect.height);
      target.x = (event.clientX - rect.left - rect.width / 2) / scale;
      target.y = (rect.height / 2 - (event.clientY - rect.top)) / scale;
    }

    function handleVisibility() {
      cancelAnimationFrame(frame);
      if (!document.hidden && !reducedMotion) frame = requestAnimationFrame(draw);
    }

    const resizeObserver = new ResizeObserver(resize);
    const themeObserver = new MutationObserver(applyColors);
    resizeObserver.observe(canvas);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-ds-theme"],
    });
    window.addEventListener("pointermove", movePointer, { passive: true });
    document.addEventListener("visibilitychange", handleVisibility);

    resize();
    applyColors();
    if (reducedMotion) draw(startedAt);
    else frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("pointermove", movePointer);
      document.removeEventListener("visibilitychange", handleVisibility);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
