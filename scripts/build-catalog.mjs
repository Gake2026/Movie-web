// Builds src/data/catalog.ts — a real movie/series/anime library with actual
// IMDb posters. IMDb IDs are pinned (curated); the suggestion API is only used
// to fetch the real poster image for each pinned ID.
// Run: node scripts/build-catalog.mjs
import { writeFileSync, mkdirSync } from "fs";

const SECTIONS = [
  {
    title: "Trending Movies",
    type: "movie",
    titles: [
      ["Dune: Part Two", "tt15239678"], ["Oppenheimer", "tt15398776"],
      ["Deadpool & Wolverine", "tt6263850"], ["Inside Out 2", "tt22022452"],
      ["John Wick: Chapter 4", "tt10366206"], ["Spider-Man: Across the Spider-Verse", "tt9362722"],
      ["The Batman", "tt1877830"], ["Top Gun: Maverick", "tt1745960"],
      ["Avatar: The Way of Water", "tt1630029"], ["Joker", "tt7286456"],
      ["Avengers: Endgame", "tt4154796"], ["Godzilla x Kong", "tt14539740"],
      ["Kung Fu Panda 4", "tt21692408"], ["Dune", "tt1160419"],
      ["Tenet", "tt6723592"], ["Parasite", "tt6751668"],
      ["1917", "tt8579674"], ["Knives Out", "tt8946378"],
    ],
  },
  {
    title: "All-Time Classics",
    type: "movie",
    titles: [
      ["The Shawshank Redemption", "tt0111161"], ["The Godfather", "tt0068646"],
      ["The Dark Knight", "tt0468569"], ["Pulp Fiction", "tt0110912"],
      ["Forrest Gump", "tt0109830"], ["Inception", "tt1375666"],
      ["The Matrix", "tt0133093"], ["Gladiator", "tt0172495"],
      ["Titanic", "tt0120338"], ["The Silence of the Lambs", "tt0102926"],
      ["Goodfellas", "tt0099685"], ["The Prestige", "tt0482571"],
      ["Whiplash", "tt2582802"], ["The Intouchables", "tt1675434"],
      ["Coco", "tt2380307"], ["Interstellar", "tt0816692"],
    ],
  },
  {
    title: "Popular Series",
    type: "series",
    titles: [
      ["Breaking Bad", "tt0903747"], ["Game of Thrones", "tt0944947"],
      ["Stranger Things", "tt4574334"], ["The Boys", "tt1190634"],
      ["Wednesday", "tt13443470"], ["Money Heist", "tt6468322"],
      ["The Witcher", "tt5180504"], ["Loki", "tt9140554"],
      ["Peaky Blinders", "tt2442560"], ["The Last of Us", "tt3581920"],
      ["Squid Game", "tt10919420"], ["Dark", "tt5753856"],
      ["The Office", "tt0386676"], ["Friends", "tt0108778"],
      ["Better Call Saul", "tt3032476"], ["The Mandalorian", "tt8111088"],
    ],
  },
  {
    title: "Top Anime",
    type: "anime",
    titles: [
      ["Attack on Titan", "tt2560140"], ["Demon Slayer", "tt9335498"],
      ["One Piece", "tt0388629"], ["Naruto", "tt0409591"],
      ["Death Note", "tt0877057"], ["Jujutsu Kaisen", "tt12343534"],
      ["My Hero Academia", "tt5626028"], ["One Punch Man", "tt4508902"],
      ["Tokyo Revengers", "tt13196080"], ["Chainsaw Man", "tt13616990"],
      ["Spy x Family", "tt13706018"], ["Hunter x Hunter", "tt2098220"],
    ],
  },
];

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Small poster for cards + larger banner for hero/backdrops — keeps the
// library fast (IMDb originals are ~2MB each; these are ~12KB / ~150KB).
function sized(url, spec) {
  if (url.includes("m.media-amazon.com") && url.includes("._V1_.jpg")) {
    return url.replace("._V1_.jpg", `._V1_${spec}_.jpg`);
  }
  return url;
}
const POSTER_SPEC = "QL75_UX190_CR0,0,190,281";
const BANNER_SPEC = "QL75_UX1280";

async function fetchPoster(title, imdbId) {
  const url = `https://v3.sg.media-imdb.com/suggestion/x/${encodeURIComponent(title)}.json`;
  const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!r.ok) throw new Error(`suggestion API ${r.status}`);
  const data = await r.json();
  const cands = (data.d || []).filter((x) => x.id && x.id.startsWith("tt"));
  const hit = cands.find((x) => x.id.toLowerCase() === imdbId.toLowerCase());
  if (!hit) return null;
  const poster = hit.i?.imageUrl || "";
  if (!poster) return null;
  return { title: hit.l || title, year: hit.y ? String(hit.y) : "", poster };
}

const out = [];
let total = 0, missed = [];
for (const sec of SECTIONS) {
  console.log(`\n== ${sec.title}`);
  const items = [];
  for (const [title, imdbId] of sec.titles) {
    try {
      const p = await fetchPoster(title, imdbId);
      if (p) {
        items.push({
          id: imdbId, title: p.title || title, type: sec.type,
          year: p.year || "2024", rating: "8.2",
          genres: ["Drama"], overview: `${p.title || title} — stream instantly in HD.`,
          imdbId, poster: sized(p.poster, POSTER_SPEC), banner: sized(p.poster, BANNER_SPEC),
        });
        console.log(`  ok  ${p.title} ${imdbId}`);
      } else {
        missed.push(`${title} (${imdbId})`);
        console.log(`  miss ${title} (${imdbId})`);
      }
    } catch (e) {
      missed.push(`${title} (${imdbId})`);
      console.log(`  err  ${title}: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  total += items.length;
  out.push({ title: sec.title, items });
}

console.log(`\nresolved ${total}, missed ${missed.length}`);
if (missed.length) console.log("missed:", missed.join(", "));

const ts =
  `import { MediaItem } from '../types';\n\n` +
  `export interface CatalogSection {\n  title: string;\n  items: MediaItem[];\n}\n\n` +
  `// Auto-generated by scripts/build-catalog.mjs — real titles with real IMDb posters.\n` +
  `export const CATALOG_SECTIONS: CatalogSection[] = ${JSON.stringify(out, null, 2)};\n`;

mkdirSync("src/data", { recursive: true });
writeFileSync("src/data/catalog.ts", ts);
console.log("wrote src/data/catalog.ts");
