import { useEffect, useRef, useState } from "react";

const HEROES = [
  { img: "goku", name: "The Saiyan", line: "Power that rises with every step." },
  { img: "broly", name: "The Legend", line: "Rage nobody can hold back." },
  { img: "frieza", name: "The Tyrant", line: "Cold, precise and never done." },
  { img: "gachiakuta", name: "The Outcast", line: "Born in the trash. Built to fight." },
];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t) => t * t * (3 - 2 * t);
const src = (n) => `${import.meta.env.BASE_URL}images/${n}.webp`;
const calm = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A card that unfolds into a spinning four-sided object while the section stays pinned,
 *  then the fighters clash. Everything is driven by scroll position, written straight to
 *  the DOM so scrolling never re-renders React. */
export default function Showcase() {
  const box = useRef(null), ring = useRef(null), flash = useRef(null), bar = useRef(null);
  const faces = useRef([]);
  const [active, setActive] = useState(0);
  const [still] = useState(calm);

  useEffect(() => {
    if (still) return;
    let raf = 0, last = -1;
    const draw = () => {
      raf = 0;
      const r = box.current.getBoundingClientRect();
      const p = clamp(-r.top / (r.height - innerHeight));
      if (p === last) return;
      last = p;
      const small = innerWidth < 640, R = small ? 210 : 360;
      const a = ease(clamp(p / 0.3)), b = clamp((p - 0.3) / 0.5), c = clamp((p - 0.8) / 0.2);
      const spin = (1 - a) * 180 + b * 360;
      const hit = Math.sin(c * Math.PI);
      const shake = hit > 0.7 ? Math.sin(p * 900) * 10 * hit : 0;
      ring.current.style.transform = `translateX(${shake}px) scale(${1 + 0.22 * hit}) rotateX(${-14 * Math.sin(a * Math.PI) + 6 * Math.sin(b * 6.28)}deg) rotateY(${spin}deg)`;
      faces.current.forEach((el, i) => { if (el) el.style.transform = `rotateY(${i * 90 * a}deg) translateZ(${R * a}px)`; });
      flash.current.style.opacity = String(clamp(1 - Math.abs(c - 0.5) * 9) * 0.9);
      bar.current.style.transform = `scaleX(${p})`;
      setActive(((-Math.round(spin / 90) % 4) + 4) % 4);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(draw); };
    draw();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, [still]);

  if (still)
    return (
      <section aria-labelledby="show-h" className="mx-auto max-w-6xl px-4 py-12">
        <h2 id="show-h" className="mb-5 text-lg font-semibold">Pick your fighter</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{HEROES.map((h) => <figure key={h.img}><img src={src(h.img)} alt={h.name} className="aspect-[2/3] w-full rounded-xl object-cover" /><figcaption className="mt-2 text-sm text-gold">{h.name}</figcaption></figure>)}</div>
      </section>
    );

  return (
    <section ref={box} aria-label="Scroll to explore the fighters" className="relative" style={{ height: "480vh" }}>
      <div className="sticky top-0 h-screen overflow-hidden" style={{ perspective: "1400px" }}>
        <div ref={bar} className="absolute inset-x-0 top-0 z-10 h-[3px] origin-left bg-gold" style={{ transform: "scaleX(0)" }} />
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_50%,rgba(252,211,77,.14),transparent_70%)]" />
        <div className="absolute inset-0 grid place-items-center" style={{ transformStyle: "preserve-3d" }}>
          <div ref={ring} className="relative h-[min(62vh,480px)] w-[min(44vw,300px)] min-w-[170px]" style={{ transformStyle: "preserve-3d" }}>
            {HEROES.map((h, i) => (
              <img key={h.img} ref={(el) => (faces.current[i] = el)} src={src(h.img)} alt={h.name} className="absolute inset-0 h-full w-full rounded-2xl border border-gold/60 object-cover shadow-2xl" />
            ))}
          </div>
        </div>
        <div ref={flash} className="pointer-events-none absolute inset-0 bg-white" style={{ opacity: 0 }} />
        <div className="pointer-events-none absolute inset-x-0 bottom-8 z-10 px-6 text-center" aria-live="polite">
          <p className="text-2xl font-bold italic text-gold sm:text-4xl">{HEROES[active].name}</p>
          <p className="mt-1 text-sm text-gray-200 sm:text-base">{HEROES[active].line}</p>
          <p className="mt-3 text-xs tracking-widest text-gray-400">SCROLL ↓</p>
        </div>
      </div>
    </section>
  );
}
