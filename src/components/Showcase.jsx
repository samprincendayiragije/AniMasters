import { useEffect, useRef, useState } from "react";

const HEROES = [
  { img: "goku", name: "The Saiyan", line: "Power that rises with every step.", acc: "#fcd34d" },
  { img: "broly", name: "The Legend", line: "Rage nobody can hold back.", acc: "#34d399" },
  { img: "frieza", name: "The Tyrant", line: "Cold, precise and never done.", acc: "#a78bfa" },
  { img: "gachiakuta", name: "The Outcast", line: "Born in the trash. Built to fight.", acc: "#f87171" },
];
const CHAPTERS = [["Unfold", 0], ["Spin", 0.3], ["Clash", 0.66], ["Join", 0.97]];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t) => t * t * (3 - 2 * t);
const src = (n) => `${import.meta.env.BASE_URL}images/${n}.webp`;
const calm = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const dots = (s, a) => `radial-gradient(circle, rgba(255,255,255,${a}) 1px, transparent 1.5px) 0 0 / ${s}px ${s}px`;

/** Pinned multi-scene story driven by scroll: card unfolds into a spinning four-sided object,
 *  two fighters collide, then everything folds back into a card and invites the visitor in.
 *  Values are written straight to the DOM, so scrolling never re-renders React. */
export default function Showcase() {
  const box = useRef(null), ring = useRef(null), flash = useRef(null), bar = useRef(null), stage = useRef(null);
  const duelL = useRef(null), duelR = useRef(null), lines = useRef(null), wave = useRef(null), cta = useRef(null);
  const far = useRef(null), near = useRef(null), faces = useRef([]), ptr = useRef({ x: 0, y: 0 });
  const [active, setActive] = useState(0);
  const [scene, setScene] = useState(0);
  const [still] = useState(calm);

  useEffect(() => {
    if (still) return;
    let raf = 0;
    const draw = () => {
      raf = 0;
      const r = box.current.getBoundingClientRect();
      const p = clamp(-r.top / (r.height - innerHeight));
      const small = innerWidth < 640, R = small ? 200 : 360, W = innerWidth;
      const a = ease(clamp(p / 0.2)), b = clamp((p - 0.2) / 0.4), c = clamp((p - 0.6) / 0.25);
      const back = ease(clamp((p - 0.88) / 0.1));
      const k = a * (1 - back);
      const spin = (1 - a) * 180 + b * 360;
      const ringOp = p < 0.58 ? 1 : p < 0.62 ? 1 - (p - 0.58) / 0.04 : p < 0.88 ? 0 : back;
      ring.current.style.opacity = String(ringOp);
      ring.current.style.transform = `rotateX(${-14 * Math.sin(a * Math.PI) * (1 - back) - ptr.current.y * 10}deg) rotateY(${spin + ptr.current.x * 14}deg)`;
      faces.current.forEach((el, i) => { if (el) el.style.transform = `rotateY(${i * 90 * k}deg) translateZ(${R * k}px)`; });

      const duelOp = clamp((p - 0.58) / 0.04) * (1 - clamp((p - 0.86) / 0.04));
      const x = 44 * (1 - ease(clamp(c * 2))) + (c > 0.5 ? 7 * Math.sin((c - 0.5) * Math.PI * 2) : 0);
      const hit = Math.max(0, 1 - Math.abs(c - 0.5) * 7);
      const sh = Math.sin(p * 1200) * 12 * hit;
      duelL.current.style.opacity = duelR.current.style.opacity = String(duelOp);
      duelL.current.style.transform = `translate(${-x * W / 100 - 8 + sh}px, ${sh}px) rotateY(26deg) scale(${1 + 0.1 * hit})`;
      duelR.current.style.transform = `translate(${x * W / 100 + 8 - sh}px, ${-sh}px) rotateY(-26deg) scale(${1 + 0.1 * hit})`;
      lines.current.style.opacity = String(hit * duelOp);
      lines.current.style.transform = `scale(${1 + hit * 0.5}) rotate(${p * 40}deg)`;
      wave.current.style.opacity = String(c > 0.48 ? clamp(1 - (c - 0.48) * 4) * duelOp : 0);
      wave.current.style.transform = `scale(${0.2 + Math.max(0, c - 0.48) * 14})`;
      flash.current.style.opacity = String(clamp(1 - Math.abs(c - 0.5) * 14) * 0.85 * duelOp);

      cta.current.style.opacity = String(clamp((p - 0.93) / 0.05));
      cta.current.style.pointerEvents = p > 0.95 ? "auto" : "none";
      bar.current.style.transform = `scaleX(${p})`;
      far.current.style.backgroundPosition = `0 ${-p * 500}px`;
      near.current.style.backgroundPosition = `0 ${-p * 1100}px`;
      setActive(((-Math.round(spin / 90) % 4) + 4) % 4);
      setScene(p < 0.58 ? 0 : p < 0.9 ? 1 : 2);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(draw); };
    const move = (e) => { ptr.current = { x: e.clientX / innerWidth - 0.5, y: e.clientY / innerHeight - 0.5 }; on(); };
    draw();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    addEventListener("pointermove", move, { passive: true });
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); removeEventListener("pointermove", move); cancelAnimationFrame(raf); };
  }, [still]);

  const jump = (f) => scrollTo({ top: box.current.offsetTop + f * (box.current.offsetHeight - innerHeight), behavior: "smooth" });
  const acc = HEROES[active].acc;

  if (still)
    return (
      <section aria-labelledby="show-h" className="mx-auto max-w-6xl px-4 py-12">
        <h2 id="show-h" className="mb-5 text-lg font-semibold">Pick your fighter</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{HEROES.map((h) => <figure key={h.img}><img src={src(h.img)} alt={h.name} className="aspect-[2/3] w-full rounded-xl object-cover" /><figcaption className="mt-2 text-sm text-gold">{h.name}</figcaption></figure>)}</div>
      </section>
    );

  const panel = "absolute left-1/2 top-1/2 h-[min(56vh,440px)] w-[min(40vw,270px)] min-w-[150px] -ml-[min(20vw,135px)] -mt-[min(28vh,220px)] rounded-2xl border object-cover shadow-2xl";
  return (
    <section ref={box} aria-label="Scroll to explore the fighters" className="relative" style={{ height: "700vh" }}>
      <div ref={stage} className="sticky top-0 h-screen overflow-hidden" style={{ perspective: "1400px", "--acc": acc }}>
        <div ref={bar} className="absolute inset-x-0 top-0 z-20 h-[3px] origin-left" style={{ transform: "scaleX(0)", background: acc, boxShadow: `0 0 14px ${acc}` }} />
        <div className="absolute inset-0 transition-colors duration-700" style={{ background: `radial-gradient(60% 50% at 50% 50%, ${acc}33, transparent 70%)` }} />
        <div ref={far} className="absolute inset-0 opacity-70" style={{ background: dots(90, 0.5) }} />
        <div ref={near} className="absolute inset-0" style={{ background: dots(140, 0.9) }} />
        <div ref={lines} className="pointer-events-none absolute left-1/2 top-1/2 h-[220vmax] w-[220vmax] -ml-[110vmax] -mt-[110vmax] opacity-0" style={{ background: "repeating-conic-gradient(from 0deg, rgba(255,255,255,.85) 0 .6deg, transparent .6deg 6deg)", WebkitMaskImage: "radial-gradient(circle, transparent 12%, #000 40%, transparent 70%)", maskImage: "radial-gradient(circle, transparent 12%, #000 40%, transparent 70%)" }} />
        <div ref={wave} className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -ml-20 -mt-20 rounded-full border-4 opacity-0" style={{ borderColor: "#fff", boxShadow: `0 0 40px ${acc}` }} />
        <div className="absolute inset-0 grid place-items-center" style={{ transformStyle: "preserve-3d" }}>
          <div ref={ring} className="relative h-[min(56vh,440px)] w-[min(40vw,270px)] min-w-[150px]" style={{ transformStyle: "preserve-3d" }}>
            {HEROES.map((h, i) => <img key={h.img} ref={(el) => (faces.current[i] = el)} src={src(h.img)} alt={h.name} className="absolute inset-0 h-full w-full rounded-2xl border object-cover shadow-2xl" style={{ borderColor: `${h.acc}99` }} />)}
          </div>
        </div>
        <img ref={duelL} src={src("goku")} alt="Goku" className={panel} style={{ opacity: 0, borderColor: "#fcd34d" }} />
        <img ref={duelR} src={src("broly")} alt="Broly" className={panel} style={{ opacity: 0, borderColor: "#34d399" }} />
        <div ref={flash} className="pointer-events-none absolute inset-0 bg-white" style={{ opacity: 0 }} />
        <div className="pointer-events-none absolute inset-x-0 bottom-7 z-10 px-6 text-center" aria-live="polite">
          {scene === 0 && <><p className="text-2xl font-bold italic sm:text-4xl" style={{ color: acc }}>{HEROES[active].name}</p><p className="mt-1 text-sm text-gray-200 sm:text-base">{HEROES[active].line}</p></>}
          {scene === 1 && <><p className="text-3xl font-black italic text-white sm:text-5xl">CLASH!</p><p className="mt-1 text-sm text-gray-200 sm:text-base">Two legends. One collision.</p></>}
          {scene === 2 && <p className="text-2xl font-bold italic text-white sm:text-4xl">The battle is yours now.</p>}
          <p className="mt-2 text-[11px] tracking-[.3em] text-gray-400">SCROLL ↓</p>
        </div>
        <div ref={cta} className="absolute inset-x-0 top-[16%] z-10 px-6 text-center" style={{ opacity: 0 }}>
          <a href="#main" className="inline-block rounded-full px-8 py-3 text-lg font-bold text-black shadow-xl" style={{ background: acc }}>Start exploring →</a>
        </div>
        <nav aria-label="Story chapters" className="absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-3">
          {CHAPTERS.map(([n, f]) => <button key={n} onClick={() => jump(f)} aria-label={`Jump to ${n}`} title={n} className="h-3 w-3 rounded-full border border-white/60 hover:scale-125" style={{ background: "rgba(255,255,255,.25)" }} />)}
        </nav>
      </div>
    </section>
  );
}
