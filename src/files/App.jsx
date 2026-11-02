import { useEffect, useRef, useState } from "react";
import { fetchMedia } from "../lib/anilist";
import Showcase from "../components/Showcase";

const GENRES = ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mystery", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural"];
const load = () => { try { return JSON.parse(localStorage.getItem("animasters:list") || "[]"); } catch { return []; } };

function Card({ m, saved, onOpen, onSave }) {
  return (
    <article className="card3d group relative overflow-hidden rounded-xl border border-white/10 bg-white/5">
      <div className="tilt"
        onPointerMove={(e) => { if (e.pointerType !== "mouse") return; const el = e.currentTarget, r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height; el.style.setProperty("--tilt-x", `${(0.5 - y) * 14}deg`); el.style.setProperty("--tilt-y", `${(x - 0.5) * 14}deg`); el.style.setProperty("--lx", `${x * 100}%`); el.style.setProperty("--ly", `${y * 100}%`); }}
        onPointerLeave={(e) => { e.currentTarget.style.setProperty("--tilt-x", "0deg"); e.currentTarget.style.setProperty("--tilt-y", "0deg"); }}>
      <button onClick={() => onOpen(m)} className="block w-full text-left" aria-label={`Open ${m.title}`}>
        <img src={m.cover} alt="" loading="lazy" className="aspect-[2/3] w-full object-cover" style={{ background: m.color }} />
        <div className="p-3"><h3 className="line-clamp-2 text-sm font-semibold">{m.title}</h3>
          <p className="mt-1 text-xs text-gray-400">{m.format}{m.score ? ` · ★ ${m.score / 10}` : ""}</p></div>
      </button>
      </div>
      <button onClick={() => onSave(m)} aria-pressed={saved} className={`absolute right-2 top-2 rounded-full px-3 py-1 text-xs font-semibold ${saved ? "bg-gold text-black" : "bg-black/70"}`}>{saved ? "Saved" : "+ Save"}</button>
    </article>
  );
}

function Detail({ m, onClose }) {
  useEffect(() => { const k = (e) => e.key === "Escape" && onClose(); addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label={m.title} className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl border border-white/10 bg-ink p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-4"><img src={m.cover} alt="" className="w-28 rounded-lg" />
          <div><h2 className="text-xl font-bold text-gold">{m.title}</h2>
            <p className="text-sm text-gray-400">{[m.format, m.count && `${m.count} ${m.format === "MANGA" ? "chapters" : "episodes"}`].filter(Boolean).join(" · ")}</p>
            <p className="mt-2 text-xs text-gray-400">{m.genres.join(", ")}</p></div></div>
        <p className="mt-4 text-sm leading-relaxed text-gray-200">{m.about || "No synopsis available."}</p>
        <h3 className="mt-5 text-sm font-semibold">Watch or read officially</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {m.watch.length ? m.watch.map((l) => <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="rounded-full bg-gold px-4 py-1.5 text-sm font-semibold text-black">{l.site}</a>)
            : <a href={m.url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/30 px-4 py-1.5 text-sm">See options on AniList</a>}
        </div>
        <button onClick={onClose} className="mt-6 rounded-full border border-white/30 px-4 py-1.5 text-sm">Close</button>
      </div>
    </div>
  );
}

export default function App() {
  const [type, setType] = useState("ANIME");
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [genre, setGenre] = useState("");
  const [res, setRes] = useState({ key: "", items: [], err: false, page: 1, next: false });
  const sentinel = useRef(null);
  const busy = useRef(false);
  const [tries, setTries] = useState(0);
  const [open, setOpen] = useState(null);
  const [list, setList] = useState(load);
  const [view, setView] = useState("browse");

  useEffect(() => { const t = setTimeout(() => setTerm(q.trim()), 350); return () => clearTimeout(t); }, [q]);
  const key = `${type}:${term}:${genre}:${tries}`;
  useEffect(() => {
    const ctl = new AbortController();
    fetchMedia(term, type, genre, 1, ctl.signal).then(({ list, hasNext }) => setRes({ key, items: list, err: false, page: 1, next: hasNext })).catch((e) => e.name !== "AbortError" && setRes({ key, items: [], err: true, page: 1, next: false }));
    return () => ctl.abort();
  }, [term, type, genre, key]);
  const items = res.items;
  const state = res.key !== key ? "loading" : res.err ? "error" : items.length ? "ok" : "empty";
  // Infinite scroll: load the next page when the sentinel nears the viewport.
  useEffect(() => {
    if (view !== "browse" || state !== "ok" || !res.next || !sentinel.current) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || busy.current) return;
      busy.current = true;
      fetchMedia(term, type, genre, res.page + 1)
        .then(({ list, hasNext }) => setRes((r) => (r.key === key ? { ...r, items: [...r.items, ...list.filter((x) => !r.items.some((y) => y.id === x.id))], page: r.page + 1, next: hasNext } : r)))
        .catch(() => {})
        .finally(() => { busy.current = false; });
    }, { rootMargin: "400px" });
    io.observe(sentinel.current);
    return () => io.disconnect();
  }, [view, state, res.next, res.page, term, type, genre, key]);
  useEffect(() => { try { localStorage.setItem("animasters:list", JSON.stringify(list)); } catch { /* storage unavailable */ } }, [list]);

  const toggle = (m) => setList((l) => (l.some((x) => x.id === m.id) ? l.filter((x) => x.id !== m.id) : [...l, m]));
  const shown = view === "list" ? list : items;
  const grid = (
    <div className="grid3d grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {shown.map((m) => <Card key={m.id} m={m} saved={list.some((x) => x.id === m.id)} onOpen={setOpen} onSave={toggle} />)}
    </div>
  );

  return (
    <>
      <div className="progress" aria-hidden="true" /><div className="glow" aria-hidden="true" />
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-gold focus:p-2 focus:text-black">Skip to content</a>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3" aria-label="Main">
          <span className="text-xl font-semibold italic text-gold">Ani<span className="text-sm text-gray-400">masters</span></span>
          <div className="flex gap-2 text-sm">
            <button onClick={() => setView("browse")} aria-current={view === "browse"} className={`rounded-full px-3 py-1 ${view === "browse" ? "bg-gold text-black" : ""}`}>Discover</button>
            <button onClick={() => setView("list")} aria-current={view === "list"} className={`rounded-full px-3 py-1 ${view === "list" ? "bg-gold text-black" : ""}`}>My list ({list.length})</button>
          </div>
        </nav>
      </header>
      <section className="relative overflow-hidden" style={{ perspective: "900px" }}>
        <div className="hero-bg absolute inset-0 bg-cover bg-center" aria-hidden="true" style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/super.webp)` }} />
        <div className="hero-content relative bg-black/65 px-4 py-14 text-center sm:py-24">
        <h1 className="text-3xl font-bold italic text-gold sm:text-5xl">Find your next favourite.</h1>
        <p className="mx-auto mt-3 max-w-xl text-gray-200">Search trending anime and manga, save what you want to follow, and jump to official places to watch or read.</p>
        <input value={q} onChange={(e) => { setQ(e.target.value); setView("browse"); }} type="search" aria-label="Search anime or manga" placeholder="Search e.g. Dragon Ball, Gachiakuta" className="mt-6 w-full max-w-md rounded-full border border-white/30 bg-black/60 px-5 py-3 text-white placeholder:text-gray-400" />
        <div className="mt-4 flex justify-center gap-2 text-sm">{["ANIME", "MANGA"].map((t) => <button key={t} onClick={() => setType(t)} aria-pressed={type === t} className={`rounded-full border px-4 py-1 ${type === t ? "border-gold bg-gold text-black" : "border-white/30"}`}>{t === "ANIME" ? "Anime" : "Manga"}</button>)}</div>
      </div></section>
      <Showcase />
      <main id="main" className="mx-auto min-h-[50vh] max-w-6xl px-4 py-10">
        {view === "browse" && (
          <div className="mb-5 flex flex-wrap gap-2 text-sm" role="group" aria-label="Filter by genre">
            {["", ...GENRES].map((g) => <button key={g} onClick={() => setGenre(g)} aria-pressed={genre === g} className={`rounded-full border px-3 py-1 ${genre === g ? "border-gold bg-gold text-black" : "border-white/20"}`}>{g || "All genres"}</button>)}
          </div>
        )}
        <h2 className="morph mb-5 origin-left text-lg font-semibold">{view === "list" ? "My list" : term ? `Results for “${term}”` : `Trending ${type === "ANIME" ? "anime" : "manga"}`}</h2>
        {view === "list" ? (list.length ? grid : <p className="text-gray-400">Nothing saved yet. Tap “+ Save” on any title.</p>)
          : state === "loading" ? <p role="status" className="text-gray-400">Loading…</p>
          : state === "error" ? <p role="alert">Couldn’t load titles. <button className="underline" onClick={() => setTries((n) => n + 1)}>Try again</button></p>
          : state === "empty" ? <p className="text-gray-400">No matches. Try another spelling or genre.</p> : <>{grid}{res.next && <div ref={sentinel} role="status" className="py-8 text-center text-sm text-gray-400">Loading more…</div>}</>}
      </main>
      <footer className="border-t border-white/10 px-4 py-8 text-center text-xs text-gray-400">
        AniMasters doesn’t host or stream episodes or chapters. Data and images come from AniList; all titles belong to their owners.
      </footer>
      {open && <Detail m={open} onClose={() => setOpen(null)} />}
    </>
  );
}
