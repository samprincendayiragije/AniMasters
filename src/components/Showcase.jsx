import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const HEROES = [
  { img: "goku", name: "The Saiyan", acc: "#fcd34d" },
  { img: "broly", name: "The Legend", acc: "#34d399" },
  { img: "frieza", name: "The Tyrant", acc: "#a78bfa" },
  { img: "gachiakuta", name: "The Outcast", acc: "#f87171" },
];
const CHAPTERS = [["Four legends", 0], ["Wrap", 0.3], ["Inside", 0.62], ["Exit", 0.96]];
const CAPTIONS = [["Four legends.", "Scroll and watch them come alive."], ["One world.", "The cards bend into a single object."], ["Step inside.", "Keep scrolling. Look around."], ["Your story starts here.", ""]];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t) => t * t * (3 - 2 * t);
const src = (n) => `${import.meta.env.BASE_URL}images/${n}.webp`;
const W = 2, H = 3.15, RING_R = W / (Math.PI / 2);

const VERT = `uniform float uK; varying vec2 vUv;
void main(){ vUv = uv; vec3 p = position; float k = max(uK, 1e-4);
  p.x = sin(position.x * k) / k; p.z = (1.0 - cos(position.x * k)) / k;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`;
const FRAG = `uniform sampler2D uMap; varying vec2 vUv;
void main(){ vec4 c = texture2D(uMap, vUv); float e = smoothstep(0.0, 0.03, min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)));
  gl_FragColor = vec4(mix(vec3(1.0, 0.85, 0.3), c.rgb, e), 1.0); }`;
const PVERT = `uniform float uP; uniform float uPx; attribute float aS; varying float vA;
void main(){ vec3 p = position; p.y = mod(p.y + uP * 14.0 * aS + 12.0, 24.0) - 12.0; p.x += uPx * aS;
  vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = aS * 70.0 / -mv.z; vA = clamp(1.0 - (-mv.z) / 30.0, 0.0, 1.0);
  gl_Position = projectionMatrix * mv; }`;
const PFRAG = `uniform vec3 uC; varying float vA;
void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; gl_FragColor = vec4(uC, (1.0 - d * 2.0) * vA); }`;

function webgl() {
  try { return !!document.createElement("canvas").getContext("webgl2"); } catch { return false; }
}

function Static() {
  return (
    <section aria-labelledby="show-h" className="mx-auto max-w-6xl px-4 py-12">
      <h2 id="show-h" className="mb-5 text-lg font-semibold">Pick your fighter</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{HEROES.map((h) => <figure key={h.img}><img src={src(h.img)} alt={h.name} className="aspect-[2/3] w-full rounded-xl object-cover" /><figcaption className="mt-2 text-sm text-gold">{h.name}</figcaption></figure>)}</div>
    </section>
  );
}

/** Real WebGL scene driven by scroll: four posters stack, spread, bend into one cylinder,
 *  the camera flies inside and looks around, then everything unwraps again. */
export default function Showcase() {
  const box = useRef(null), canvas = useRef(null), bar = useRef(null), cta = useRef(null);
  const [scene, setScene] = useState(0);
  const [fallback] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches || !webgl());

  useEffect(() => {
    if (fallback) return;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas: canvas.current, antialias: true, alpha: true }); } catch { return; }
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    const sc = new THREE.Scene();
    sc.fog = new THREE.Fog(0x0b0b10, 10, 26);
    const cam = new THREE.PerspectiveCamera(50, 1, 0.1, 60);
    const group = new THREE.Group();
    sc.add(group);
    const loader = new THREE.TextureLoader();
    const mats = [], meshes = HEROES.map((h) => {
      const tex = loader.load(src(h.img)); tex.colorSpace = THREE.NoColorSpace; tex.anisotropy = 4;
      const m = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: { uMap: { value: tex }, uK: { value: 0 } }, side: THREE.DoubleSide });
      mats.push(m);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(W, H, 48, 1), m);
      group.add(mesh);
      return mesh;
    });
    const N = 1400, pos = new Float32Array(N * 3), sz = new Float32Array(N);
    for (let i = 0; i < N; i++) { pos.set([(Math.random() - 0.5) * 26, (Math.random() - 0.5) * 24, (Math.random() - 0.5) * 26], i * 3); sz[i] = 0.3 + Math.random() * 1.1; }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(pos, 3)); pg.setAttribute("aS", new THREE.BufferAttribute(sz, 1));
    const pm = new THREE.ShaderMaterial({ vertexShader: PVERT, fragmentShader: PFRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uP: { value: 0 }, uPx: { value: 0 }, uC: { value: new THREE.Color("#fcd34d") } } });
    sc.add(new THREE.Points(pg, pm));

    let scale = 1, vis = true, raf = 0, shown = -1;
    const ptr = { x: 0, y: 0 };
    const resize = () => {
      const w = canvas.current.clientWidth, h = canvas.current.clientHeight;
      renderer.setSize(w, h, false); cam.aspect = w / h;
      const visW = 2 * 8 * Math.tan((cam.fov * Math.PI) / 360) * cam.aspect;
      scale = Math.min(1, (visW * 0.9) / (4 * W * 1.08)); group.scale.setScalar(scale); cam.updateProjectionMatrix();
    };
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!vis) return;
      const r = box.current.getBoundingClientRect();
      const p = clamp(-r.top / (r.height - innerHeight));
      const s = ease(clamp(p / 0.2)), t = ease(clamp((p - 0.25) / 0.25)) * (1 - ease(clamp((p - 0.9) / 0.1)));
      group.rotation.set(0, (1 - s) * Math.PI + ptr.x * 0.25, ptr.y * 0.12);
      meshes.forEach((m, i) => {
        const phi = (i * Math.PI) / 2, rowX = (i - 1.5) * W * 1.08 * s * (1 - t);
        m.position.set(THREE.MathUtils.lerp(rowX, -RING_R * Math.sin(phi), t), 0, THREE.MathUtils.lerp(i * 0.04, -RING_R * Math.cos(phi), t));
        m.rotation.set(0, phi * t, (i - 1.5) * 0.07 * (1 - s));
        mats[i].uniforms.uK.value = t * (Math.PI / 2 / W);
      });
      const inside = ease(clamp((p - 0.5) / 0.12)) * (1 - ease(clamp((p - 0.84) / 0.1)));
      const look = clamp((p - 0.62) / 0.22) * Math.PI * 2;
      cam.position.set(0, 0, 8 * (1 - inside) + 0.01);
      cam.rotation.set(-ptr.y * 0.15, inside * (look + ptr.x * 0.4), 0);
      cam.fov = 50 + 22 * inside; cam.updateProjectionMatrix();
      const idx = Math.min(3, Math.floor(p * 4.0 / 1.0001));
      pm.uniforms.uP.value = p; pm.uniforms.uPx.value = ptr.x * 2;
      pm.uniforms.uC.value.set(HEROES[Math.round(((look / (Math.PI / 2)) % 4 + 4) % 4) % 4].acc);
      bar.current.style.transform = `scaleX(${p})`;
      cta.current.style.opacity = String(clamp((p - 0.93) / 0.05)); cta.current.style.pointerEvents = p > 0.95 ? "auto" : "none";
      if (idx !== shown) { shown = idx; setScene(idx); }
      renderer.render(sc, cam);
    };
    const io = new IntersectionObserver(([e]) => { vis = e.isIntersecting; }, { rootMargin: "100px" });
    io.observe(box.current);
    const move = (e) => { ptr.x = e.clientX / innerWidth - 0.5; ptr.y = e.clientY / innerHeight - 0.5; };
    resize(); tick();
    addEventListener("resize", resize); addEventListener("pointermove", move, { passive: true });
    return () => {
      cancelAnimationFrame(raf); io.disconnect(); removeEventListener("resize", resize); removeEventListener("pointermove", move);
      meshes.forEach((m) => m.geometry.dispose()); mats.forEach((m) => { m.uniforms.uMap.value.dispose(); m.dispose(); }); pg.dispose(); pm.dispose(); renderer.dispose();
    };
  }, [fallback]);

  if (fallback) return <Static />;
  const jump = (f) => scrollTo({ top: box.current.offsetTop + f * (box.current.offsetHeight - innerHeight), behavior: "smooth" });
  return (
    <section ref={box} id="showcase" aria-label="Scroll to explore the fighters" className="relative" style={{ height: "800vh" }}>
      <div className="sticky top-0 h-screen overflow-hidden bg-ink">
        <canvas ref={canvas} className="absolute inset-0 h-full w-full" aria-hidden="true" />
        <div ref={bar} className="absolute inset-x-0 top-0 z-20 h-[3px] origin-left bg-gold" style={{ transform: "scaleX(0)", boxShadow: "0 0 14px #fcd34d" }} />
        <div className="pointer-events-none absolute inset-x-0 bottom-7 z-10 px-6 text-center" aria-live="polite">
          <p className="text-2xl font-bold italic text-white sm:text-4xl">{CAPTIONS[scene][0]}</p>
          <p className="mt-1 text-sm text-gray-300 sm:text-base">{CAPTIONS[scene][1]}</p>
          <p className="mt-2 text-[11px] tracking-[.3em] text-gray-400">SCROLL ↓</p>
        </div>
        <div ref={cta} className="absolute inset-x-0 top-[16%] z-10 px-6 text-center" style={{ opacity: 0 }}>
          <a href="#main" className="inline-block rounded-full bg-gold px-8 py-3 text-lg font-bold text-black shadow-xl">Start exploring →</a>
        </div>
        <nav aria-label="Story chapters" className="absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-3">
          {CHAPTERS.map(([n, f]) => <button key={n} onClick={() => jump(f)} aria-label={`Jump to ${n}`} title={n} className="h-3 w-3 rounded-full border border-white/60 bg-white/25 hover:scale-125" />)}
        </nav>
      </div>
    </section>
  );
}
