/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from "react";
import { Leaf } from "lucide-react";

interface WelcomePageProps {
  onStart: () => void;
}

export default function WelcomePage({ onStart }: WelcomePageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
      console.warn("WebGL not supported in this browser.");
      return;
    }

    const vsSource = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fsSource = `
      precision highp float;
      varying vec2 v_texCoord;
      uniform float u_time;
      uniform vec2 u_resolution;

      float noise(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }

      float smooth_noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float a = noise(i);
          float b = noise(i + vec2(1.0, 0.0));
          float c = noise(i + vec2(0.0, 1.0));
          float d = noise(i + vec2(1.0, 1.0));
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 5; i++) {
              v += a * smooth_noise(p);
              p *= 2.0;
              a *= 0.5;
          }
          return v;
      }

      void main() {
          vec2 uv = v_texCoord;
          uv.x *= u_resolution.x / u_resolution.y;
          
          vec2 p = uv * 3.0 + u_time * 0.05;
          float n = fbm(p);
          
          float lines = sin(n * 20.0);
          lines = smoothstep(0.0, 0.1, abs(lines));
          
          vec3 baseColor = vec3(0.106, 0.369, 0.125); // #1B5E20 Deep Forest Green
          vec3 accentColor = vec3(0.18, 0.49, 0.2); // #2E7D32 Medium Forest Green
          
          vec3 color = mix(baseColor, accentColor, n);
          color = mix(color, vec3(1.0), (1.0 - lines) * 0.15); // Subtle white contour lines
          
          gl_FragColor = vec4(color, 1.0);
      }
    `;

    function createShader(gl: WebGLRenderingContext, type: number, source: string) {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compiles failed:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const program = gl.createProgram();
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

    if (!program || !vertexShader || !fragmentShader) return;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("WebGL Program linking failed:", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "u_time");
    const uResolution = gl.getUniformLocation(program, "u_resolution");

    let animationFrameId: number;
    let startTime = performance.now();

    function renderLoop() {
      if (!canvas || !gl) return;
      
      const currentTime = performance.now();
      const timeInSeconds = (currentTime - startTime) * 0.001;

      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, timeInSeconds);
      if (uResolution) gl.uniform2f(uResolution, canvas.width, canvas.height);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(renderLoop);
    }

    animationFrameId = requestAnimationFrame(renderLoop);

    // Responsive element resizing with ResizeObserver to prevent fixed scale glitches
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="fixed inset-0 min-h-screen w-screen overflow-hidden flex flex-col justify-center items-center font-sans" id="welcome-page-root">
      {/* Background Shader Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full z-0 pointer-events-none" id="welcome-canvas-container">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block object-cover" id="shader-canvas-welcome" />
        {/* Soft elegant vignette layer */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] z-10" />
      </div>

      {/* Main Content Card Card */}
      <main className="relative z-20 w-full h-full flex flex-col justify-center items-center px-6 md:px-12 max-w-4xl mx-auto text-center" id="welcome-content-card">
        {/* Logo Area */}
        <div className="mb-8 flex flex-col items-center animate-fadeIn" id="welcome-logo-wrapper">
          <div className="w-20 h-20 bg-[#00450d] text-white rounded-2xl flex items-center justify-center mb-4 shadow-[0px_4px_6px_rgba(0,0,0,0.02),0px_10px_15px_rgba(27,94,32,0.15)] transform transition-transform hover:scale-105 duration-300 border border-emerald-900/35">
            <Leaf className="h-10 w-10 text-emerald-350 fill-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-md">
            GreenLens
          </h1>
        </div>

        {/* Mission Statement */}
        <div className="max-w-2xl mb-12 space-y-4 animate-fadeIn" id="welcome-mission-statements">
          <h2 className="text-xl md:text-3xl font-bold text-white leading-snug drop-shadow-sm">
            Turning community observations into environmental intelligence in Cameroon.
          </h2>
          <p className="text-sm md:text-lg text-emerald-100/90 font-medium max-w-xl mx-auto leading-relaxed">
            See environmental change. Understand impact. Help communities improve.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center justify-center pt-2 animate-fadeIn" id="welcome-actions">
          <button
            onClick={onStart}
            className="w-full sm:w-auto px-8 py-3.5 bg-[#00450d] hover:bg-emerald-900 text-white hover:text-[#90d689] rounded-full text-xs font-bold tracking-wider uppercase transition-all shadow-md hover:shadow-[0px_10px_15px_rgba(27,94,32,0.15)] hover:-translate-y-0.5 duration-200 cursor-pointer"
            id="welcome-start-btn"
          >
            Get Started
          </button>
          <button
            onClick={onStart}
            className="w-full sm:w-auto px-8 py-3.5 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-full text-xs font-bold tracking-wider uppercase hover:bg-white/30 transition-all hover:-translate-y-0.5 duration-200 cursor-pointer"
            id="welcome-explore-btn"
          >
            Explore Platform
          </button>
        </div>
      </main>
    </div>
  );
}
