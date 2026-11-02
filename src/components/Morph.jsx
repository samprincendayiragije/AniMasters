import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// Four shapes the object keeps morphing between (the last one loops back to the first).
const PALETTE = ["#f97316", "#fcd34d", "#a78bfa", "#f87171"];
const TAU = Math.PI * 2;
const sp = (x, e) => Math.sign(x) * Math.pow(Math.abs(x), e);
const SHAPES = [
  (t, f) => [Math.sin(f) * Math.cos(t), Math.cos(f), Math.sin(f) * Math.sin(t)],                       // Dragon Ball sphere
  (t, f) => { const b = f * 2, R = 0.85 + 0.4 * Math.cos(b); return [R * Math.cos(t) * 1.1, 0.45 * Math.sin(b) * 1.1, R * Math.sin(t) * 1.1]; }, // energy ring
  (t, f) => { const r = 0.6 + 0.95 * Math.pow(Math.abs(Math.cos(3 * t) * Math.sin(f)), 3); return [r * Math.sin(f) * Math.cos(t), r * Math.cos(f), r * Math.sin(f) * Math.sin(t)]; }, // shuriken star
  (t, f) => [sp(Math.sin(f), 0.3) * sp(Math.cos(t), 0.3), sp(Math.cos(f), 0.3), sp(Math.sin(f), 0.3) * sp(Math.sin(t), 0.3)], // rounded cube
];

const VERT = `uniform float uT; uniform float uTime; uniform float uOut; attribute vec3 aB; attribute vec3 aC; attribute vec3 aD; varying vec3 vV;
vec3 sh(float k){ if(k < 0.5) return position; if(k < 1.5) return aB; if(k < 2.5) return aC; return aD; }
void main(){ float i = floor(uT); float f = smoothstep(0.0, 1.0, fract(uT));
  vec3 p = mix(sh(mod(i, 4.0)), sh(mod(i + 1.0, 4.0)), f);
  p += normalize(p) * (0.035 * sin(uTime * 2.0 + p.y * 5.0) + uOut * 0.05);
  vec4 mv = modelViewMatrix * vec4(p, 1.0); vV = mv.xyz; gl_Position = projectionMatrix * mv; }`;
const FRAG = `uniform vec3 uColor; uniform float uOut; varying vec3 vV;
void main(){ if(uOut > 0.5){ gl_FragColor = vec4(0.02, 0.02, 0.05, 1.0); return; }
  vec3 n = normalize(cross(dFdx(vV), dFdy(vV))); vec3 v = normalize(-vV); if(dot(n, v) < 0.0) n = -n;
  float d = dot(n, normalize(vec3(0.5, 0.8, 0.6)));
  float band = d < 0.0 ? 0.35 : d < 0.35 ? 0.6 : d < 0.7 ? 0.85 : 1.1;
  float rim = step(0.72, 1.0 - abs(dot(n, v)));
  gl_FragColor = vec4(uColor * band + rim * vec3(0.9), 1.0); }`;

/** One cel-shaded object that follows the whole page and never stops changing shape:
 *  scroll distance picks the shape, scroll speed stretches it. Non-interactive. */
export default function Morph() {
  const canvas = useRef(null);
  const [off] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches || !document.createElement("canvas").getContext("webgl2"));

  useEffect(() => {
    if (off) return;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas: canvas.current, antialias: true, alpha: true }); } catch { return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
    cam.position.z = 9;
    const base = new THREE.SphereGeometry(1, 96, 64), uv = base.attributes.uv, n = uv.count;
    const arr = SHAPES.map(() => new Float32Array(n * 3));
    for (let i = 0; i < n; i++) { const t = uv.getX(i) * TAU, f = (1 - uv.getY(i)) * Math.PI; SHAPES.forEach((s, k) => arr[k].set(s(t, f), i * 3)); }
    base.setAttribute("position", new THREE.BufferAttribute(arr[0], 3));
    ["aB", "aC", "aD"].forEach((name, k) => base.setAttribute(name, new THREE.BufferAttribute(arr[k + 1], 3)));
    const U = { uT: { value: 0 }, uTime: { value: 0 }, uColor: { value: new THREE.Color(PALETTE[0]) } };
    const fill = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: { ...U, uOut: { value: 0 } } });
    const line = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: { ...U, uOut: { value: 1 } }, side: THREE.BackSide });
    const obj = new THREE.Group();
    obj.add(new THREE.Mesh(base, fill), new THREE.Mesh(base, line));
    sc.add(obj);

    const ca = new THREE.Color(), cb = new THREE.Color();
    let raf = 0, y = scrollY, speed = 0, fade = 1;
    const showcase = () => document.getElementById("showcase");
    const resize = () => { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
    const tick = (ms) => {
      raf = requestAnimationFrame(tick);
      if (document.hidden) return;
      const target = scrollY, prev = y;
      y += (target - y) * 0.12; speed += ((y - prev) - speed) * 0.2;
      const T = y / (innerHeight * 1.1), big = innerWidth >= 1100;
      U.uT.value = T % 4; U.uTime.value = ms / 1000;
      const i = Math.floor(T), f = T - i;
      U.uColor.value.copy(ca.set(PALETTE[i % 4])).lerp(cb.set(PALETTE[(i + 1) % 4]), f);
      const stretch = Math.min(Math.abs(speed) * 0.02, 0.45);
      obj.scale.set(1 - stretch * 0.4, 1 + stretch, 1 - stretch * 0.4).multiplyScalar(big ? 1.45 : 0.75);
      obj.rotation.set(y * 0.0022, y * 0.0045 + ms * 0.0002, 0);
      const halfW = Math.tan((cam.fov * Math.PI) / 360) * cam.position.z * cam.aspect;
      obj.position.set(halfW * (big ? 0.82 : 0.68), Math.sin(T * 1.3) * (big ? 1.2 : 0.8) - (big ? 0 : 1.6), 0);
      const sec = showcase(), r = sec?.getBoundingClientRect(), inShow = r && r.top < innerHeight * 0.8 && r.bottom > innerHeight * 0.2;
      fade += ((inShow ? 0 : big ? 0.95 : 0.5) - fade) * 0.1;
      canvas.current.style.opacity = String(fade);
      renderer.render(sc, cam);
    };
    resize(); raf = requestAnimationFrame(tick);
    addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); base.dispose(); fill.dispose(); line.dispose(); renderer.dispose(); };
  }, [off]);

  if (off) return null;
  return <canvas ref={canvas} aria-hidden="true" className="pointer-events-none fixed inset-0 z-30 h-full w-full" style={{ opacity: 0 }} />;
}
