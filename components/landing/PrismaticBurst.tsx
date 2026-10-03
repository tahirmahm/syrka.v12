'use client'

import { useEffect, useRef } from 'react'
import { Renderer, Program, Mesh, Triangle, Texture } from 'ogl'

/* Prismatic light burst (WebGL via ogl), ported from React Bits' PrismaticBurst. */

const vertexShader = `#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
}
`

const fragmentShader = `#version 300 es
precision highp float;
precision highp int;

out vec4 fragColor;

uniform vec2  uResolution;
uniform float uTime;

uniform float uIntensity;
uniform float uSpeed;
uniform int   uAnimType;
uniform vec2  uMouse;
uniform int   uColorCount;
uniform float uDistort;
uniform vec2  uOffset;
uniform sampler2D uGradient;
uniform float uNoiseAmount;
uniform int   uRayCount;

float hash21(vec2 p){
    p = floor(p);
    float f = 52.9829189 * fract(dot(p, vec2(0.065, 0.005)));
    return fract(f);
}

mat2 rot30(){ return mat2(0.8, -0.5, 0.5, 0.8); }

float layeredNoise(vec2 fragPx){
    vec2 p = mod(fragPx + vec2(uTime * 30.0, -uTime * 21.0), 1024.0);
    vec2 q = rot30() * p;
    float n = 0.0;
    n += 0.40 * hash21(q);
    n += 0.25 * hash21(q * 2.0 + 17.0);
    n += 0.20 * hash21(q * 4.0 + 47.0);
    n += 0.10 * hash21(q * 8.0 + 113.0);
    n += 0.05 * hash21(q * 16.0 + 191.0);
    return n;
}

vec3 rayDir(vec2 frag, vec2 res, vec2 offset, float dist){
    float focal = res.y * max(dist, 1e-3);
    return normalize(vec3(2.0 * (frag - offset) - res, focal));
}

float edgeFade(vec2 frag, vec2 res, vec2 offset){
    vec2 toC = frag - 0.5 * res - offset;
    float r = length(toC) / (0.5 * min(res.x, res.y));
    float x = clamp(r, 0.0, 1.0);
    float q = x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
    float s = q * 0.5;
    s = pow(s, 1.5);
    float tail = 1.0 - pow(1.0 - s, 2.0);
    s = mix(s, tail, 0.2);
    float dn = (layeredNoise(frag * 0.15) - 0.5) * 0.0015 * s;
    return clamp(s + dn, 0.0, 1.0);
}

mat3 rotX(float a){ float c = cos(a), s = sin(a); return mat3(1.0,0.0,0.0, 0.0,c,-s, 0.0,s,c); }
mat3 rotY(float a){ float c = cos(a), s = sin(a); return mat3(c,0.0,s, 0.0,1.0,0.0, -s,0.0,c); }
mat3 rotZ(float a){ float c = cos(a), s = sin(a); return mat3(c,-s,0.0, s,c,0.0, 0.0,0.0,1.0); }

vec3 sampleGradient(float t){
    t = clamp(t, 0.0, 1.0);
    return texture(uGradient, vec2(t, 0.5)).rgb;
}

vec2 rot2(vec2 v, float a){
    float s = sin(a), c = cos(a);
    return mat2(c, -s, s, c) * v;
}

float bendAngle(vec3 q, float t){
    return 0.8 * sin(q.x * 0.55 + t * 0.6)
         + 0.7 * sin(q.y * 0.50 - t * 0.5)
         + 0.6 * sin(q.z * 0.60 + t * 0.7);
}

void main(){
    vec2 frag = gl_FragCoord.xy;
    float t = uTime * uSpeed;
    float jitterAmp = 0.1 * clamp(uNoiseAmount, 0.0, 1.0);
    vec3 dir = rayDir(frag, uResolution, uOffset, 1.0);
    float marchT = 0.0;
    vec3 col = vec3(0.0);
    float n = layeredNoise(frag);
    vec4 c = cos(t * 0.2 + vec4(0.0, 33.0, 11.0, 0.0));
    mat2 M2 = mat2(c.x, c.y, c.z, c.w);
    float amp = clamp(uDistort, 0.0, 50.0) * 0.15;

    mat3 rot3dMat = mat3(1.0);
    if(uAnimType == 1){
      vec3 ang = vec3(t * 0.31, t * 0.21, t * 0.17);
      rot3dMat = rotZ(ang.z) * rotY(ang.y) * rotX(ang.x);
    }
    mat3 hoverMat = mat3(1.0);
    if(uAnimType == 2){
      vec2 m = uMouse * 2.0 - 1.0;
      vec3 ang = vec3(m.y * 0.6, m.x * 0.6, 0.0);
      hoverMat = rotY(ang.y) * rotX(ang.x);
    }

    for (int i = 0; i < 44; ++i) {
        vec3 P = marchT * dir;
        P.z -= 2.0;
        float rad = length(P);
        vec3 Pl = P * (10.0 / max(rad, 1e-6));

        if(uAnimType == 0){
            Pl.xz *= M2;
        } else if(uAnimType == 1){
            Pl = rot3dMat * Pl;
        } else {
            Pl = hoverMat * Pl;
        }

        float stepLen = min(rad - 0.3, n * jitterAmp) + 0.1;

        float grow = smoothstep(0.35, 3.0, marchT);
        float a1 = amp * grow * bendAngle(Pl * 0.6, t);
        float a2 = 0.5 * amp * grow * bendAngle(Pl.zyx * 0.5 + 3.1, t * 0.9);
        vec3 Pb = Pl;
        Pb.xz = rot2(Pb.xz, a1);
        Pb.xy = rot2(Pb.xy, a2);

        float rayPattern = smoothstep(
            0.5, 0.7,
            sin(Pb.x + cos(Pb.y) * cos(Pb.z)) *
            sin(Pb.z + sin(Pb.y) * cos(Pb.x + t))
        );

        if (uRayCount > 0) {
            float ang = atan(Pb.y, Pb.x);
            float comb = 0.5 + 0.5 * cos(float(uRayCount) * ang);
            comb = pow(comb, 3.0);
            rayPattern *= smoothstep(0.15, 0.95, comb);
        }

        vec3 spectralDefault = 1.0 + vec3(
            cos(marchT * 3.0 + 0.0),
            cos(marchT * 3.0 + 1.0),
            cos(marchT * 3.0 + 2.0)
        );

        float saw = fract(marchT * 0.25);
        float tRay = saw * saw * (3.0 - 2.0 * saw);
        vec3 userGradient = 2.0 * sampleGradient(tRay);
        vec3 spectral = (uColorCount > 0) ? userGradient : spectralDefault;
        vec3 base = (0.05 / (0.4 + stepLen))
                  * smoothstep(5.0, 0.0, rad)
                  * spectral;

        col += base * rayPattern;
        marchT += stepLen;
    }

    col *= edgeFade(frag, uResolution, uOffset);
    col *= uIntensity;
    fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.trim().replace(/^#/, '')
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  const v = parseInt(h.slice(0, 6), 16)
  if (Number.isNaN(v) || (h.length !== 6 && h.length !== 8)) return [255, 255, 255]
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
}

const ANIM = { rotate: 0, rotate3d: 1, hover: 2 } as const

interface Props {
  intensity?: number
  speed?: number
  animationType?: keyof typeof ANIM
  colors?: string[]
  distort?: number
  paused?: boolean
  offset?: { x: number; y: number }
  hoverDampness?: number
  rayCount?: number
  mixBlendMode?: React.CSSProperties['mixBlendMode']
  className?: string
}

export default function PrismaticBurst({
  intensity = 2,
  speed = 0.5,
  animationType = 'rotate3d',
  colors,
  distort = 0,
  paused = false,
  offset = { x: 0, y: 0 },
  hoverDampness = 0,
  rayCount = 0,
  mixBlendMode = 'lighten',
  className = '',
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const settings = useRef({ intensity, speed, animationType, colors, distort, paused, offset, hoverDampness, rayCount })
  useEffect(() => {
    settings.current = { intensity, speed, animationType, colors, distort, paused, offset, hoverDampness, rayCount }
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio || 1, 2), alpha: false, antialias: false })
    const gl = renderer.gl
    Object.assign(gl.canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', mixBlendMode: mixBlendMode ?? '' })
    container.appendChild(gl.canvas)

    const gradient = new Texture(gl, { image: new Uint8Array([255, 255, 255, 255]), width: 1, height: 1, generateMipmaps: false, flipY: false })
    gradient.minFilter = gl.LINEAR; gradient.magFilter = gl.LINEAR
    gradient.wrapS = gl.CLAMP_TO_EDGE; gradient.wrapT = gl.CLAMP_TO_EDGE

    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uResolution: { value: [1, 1] },
        uTime: { value: 0 },
        uIntensity: { value: 1 },
        uSpeed: { value: 1 },
        uAnimType: { value: 0 },
        uMouse: { value: [0.5, 0.5] },
        uColorCount: { value: 0 },
        uDistort: { value: 0 },
        uOffset: { value: [0, 0] },
        uGradient: { value: gradient },
        uNoiseAmount: { value: 0.8 },
        uRayCount: { value: 0 },
      },
    })
    const geometry = new Triangle(gl)
    const mesh = new Mesh(gl, { geometry, program })

    // Upload the colour ramp once; it is fixed for the life of the component.
    const cols = (settings.current.colors ?? []).slice(0, 64)
    if (cols.length) {
      const data = new Uint8Array(cols.length * 4)
      cols.forEach((c, i) => { const [r, g, b] = hexToRgb(c); data.set([r, g, b, 255], i * 4) })
      gradient.image = data
      gradient.width = cols.length
      gradient.needsUpdate = true
    }
    program.uniforms.uColorCount.value = cols.length

    const resize = () => {
      renderer.setSize(container.clientWidth || 1, container.clientHeight || 1)
      program.uniforms.uResolution.value = [gl.drawingBufferWidth, gl.drawingBufferHeight]
    }
    const ro = new ResizeObserver(resize)
    ro.observe(container)
    resize()

    const mouseTarget = [0.5, 0.5], mouse = [0.5, 0.5]
    const onPointer = (e: PointerEvent) => {
      const r = container.getBoundingClientRect()
      mouseTarget[0] = Math.min(1, Math.max(0, (e.clientX - r.left) / Math.max(r.width, 1)))
      mouseTarget[1] = Math.min(1, Math.max(0, (e.clientY - r.top) / Math.max(r.height, 1)))
    }
    container.addEventListener('pointermove', onPointer, { passive: true })

    let visible = true
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting }, { threshold: 0.01 })
    io.observe(container)

    let raf = 0, last = performance.now(), time = 0
    const update = (now: number) => {
      raf = requestAnimationFrame(update)
      const dt = Math.max(0, now - last) * 0.001
      last = now
      const s = settings.current
      if (!s.paused) time += dt
      if (!visible || document.hidden) return
      const a = 1 - Math.exp(-dt / (0.02 + Math.max(0, Math.min(1, s.hoverDampness)) * 0.5))
      mouse[0] += (mouseTarget[0] - mouse[0]) * a
      mouse[1] += (mouseTarget[1] - mouse[1]) * a
      const u = program.uniforms
      u.uMouse.value = mouse
      u.uTime.value = time
      u.uIntensity.value = s.intensity
      u.uSpeed.value = s.speed
      u.uAnimType.value = ANIM[s.animationType]
      u.uDistort.value = s.distort
      u.uOffset.value = [s.offset.x, s.offset.y]
      u.uRayCount.value = Math.max(0, Math.floor(s.rayCount))
      renderer.render({ scene: mesh })
    }
    raf = requestAnimationFrame(update)

    return () => {
      cancelAnimationFrame(raf)
      container.removeEventListener('pointermove', onPointer)
      ro.disconnect()
      io.disconnect()
      if (gl.canvas.parentNode === container) container.removeChild(gl.canvas)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
    // The ramp and blend mode are fixed at mount; everything else is read live from `settings`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={containerRef} className={`relative h-full w-full overflow-hidden ${className}`} />
}
