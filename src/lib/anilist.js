const Q = `query($s:String,$t:MediaType){Page(perPage:24){media(search:$s,type:$t,sort:[TRENDING_DESC,POPULARITY_DESC],isAdult:false){id title{romaji english}coverImage{large color}averageScore format episodes chapters genres description(asHtml:false) siteUrl externalLinks{site url type}}}}`;
const cache = new Map();

/** Fetch trending or searched media from AniList. Throws on failure; caller shows a retry. */
export async function fetchMedia(search, type, signal) {
  const key = `${type}:${search}`;
  if (cache.has(key)) return cache.get(key);
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 12000);
  signal?.addEventListener("abort", () => ctl.abort());
  try {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: Q, variables: { s: search || null, t: type } }),
      signal: ctl.signal,
    });
    if (!res.ok) throw new Error(`AniList error ${res.status}`);
    const json = await res.json();
    const list = (json?.data?.Page?.media ?? []).map(normalize);
    cache.set(key, list);
    return list;
  } finally {
    clearTimeout(timer);
  }
}

export function normalize(m) {
  return {
    id: m.id,
    title: m.title?.english || m.title?.romaji || "Untitled",
    cover: m.coverImage?.large,
    color: m.coverImage?.color || "#fcd34d",
    score: m.averageScore ?? null,
    format: m.format?.replace(/_/g, " ") ?? "",
    count: m.episodes ?? m.chapters ?? null,
    genres: m.genres ?? [],
    about: (m.description ?? "").replace(/<[^>]+>/g, "").trim(),
    url: m.siteUrl,
    watch: (m.externalLinks ?? []).filter((l) => l.type === "STREAMING"),
  };
}
