import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client
let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY environment variable is not configured yet. Configure it in Settings > Secrets.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

// Search and recommendation endpoint
app.get("/api/search", async (req, res) => {
  const query = req.query.q as string;
  if (!query) {
    return res.status(400).json({ error: "Missing query parameter 'q'" });
  }

  try {
    const ai = getGeminiClient();
    
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Search for the movie, TV series, or anime: "${query}". Find its official IMDb ID, exact release year, average rating (usually out of 10), list of matching genres, plot overview, and details on seasons/episodes is it's a TV series or anime. Ground your search using Google Search to ensure exact and valid IMDb ID lookup (IMDb ID must start with "tt"). Suggest a suitable Unsplash search string or placeholder for visual appeal.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              imdbId: { type: Type.STRING, description: "Official IMDB ID starting with 'tt'" },
              title: { type: Type.STRING, description: "Official title of the movie, series, or anime" },
              type: { type: Type.STRING, description: "Must be 'movie', 'series', or 'anime'" },
              year: { type: Type.STRING, description: "Release year (e.g. '2023')" },
              rating: { type: Type.STRING, description: "IMDb Rating (e.g., '8.4')" },
              genres: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Genres, e.g., ['Science Fiction', 'Drama']"
              },
              overview: { type: Type.STRING, description: "Clean plot synopsis" },
              seasonsCount: { type: Type.INTEGER, description: "Number of seasons (only specify if it is series/anime, else null)" },
              episodesCount: { type: Type.INTEGER, description: "Total number of episodes (only if series/anime, else null)" },
              episodesPerSeason: {
                type: Type.ARRAY,
                items: { type: Type.INTEGER },
                description: "Episode counts for each season (e.g. [8, 9, 8], only if series/anime, else null)"
              },
              poster: { type: Type.STRING, description: "A high-quality Unsplash image search URL related to the search thematic" },
              banner: { type: Type.STRING, description: "A high-quality wide Unsplash photo search URL related to the search thematic" }
            },
            required: ["imdbId", "title", "type", "year", "genres", "overview"]
          }
        }
      }
    });

    const parsedResults = JSON.parse(response.text || "[]");
    
    // Inject stable fields
    const processedResults = parsedResults.map((item: any) => {
      // Ensure poster and banners are valid or default to aesthetic unsplash categories
      const queryStr = encodeURIComponent(`${item.title} keyart movie`);
      const landscapeStr = encodeURIComponent(`${item.title} cinematic scenery`);
      
      return {
        ...item,
        id: item.imdbId || `fake-${Math.random()}`,
        poster: item.poster || `https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&q=80&w=600&fit=crop&q=80&sig=${item.imdbId || 'poster'}`,
        banner: item.banner || `https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&q=80&w=1200&fit=crop&q=80&sig=${item.imdbId || 'banner'}`
      };
    });

    res.json({ results: processedResults });
  } catch (err: any) {
    console.error("Gemini lookup failed or key not configured. Falling back to local offline recommendation search.", err.message);
    
    // Let's do a programmatic fuzzy match on FEATURED_MEDIA for seamless fallback offline search experience
    const mockList = [
      {
        id: "tt15398730",
        title: "Oppenheimer",
        type: "movie",
        year: "2023",
        rating: "8.4",
        genres: ["Biography", "Drama", "History"],
        overview: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb, which saved and transformed the world.",
        imdbId: "tt15398730",
        poster: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&q=80&w=600",
        banner: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&q=80&w=1200"
      },
      {
        id: "tt22062716",
        title: "Inside Out 2",
        type: "movie",
        year: "2024",
        rating: "7.7",
        genres: ["Animation", "Comedy", "Family"],
        overview: "Follow Riley in her teenage years as she encounters new, sophisticated emotions that challenge her core beliefs.",
        imdbId: "tt22062716",
        poster: "https://images.unsplash.com/photo-1608889175123-8ec330b86f84?auto=format&q=80&w=600",
        banner: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&q=80&w=1200"
      },
      {
        id: "tt13443470",
        title: "Wednesday",
        type: "series",
        year: "2022",
        rating: "8.1",
        genres: ["Comedy", "Fantasy", "Mystery"],
        overview: "Infused with investigatory, supernaturally inclined mysteries, Wednesday Addams navigates life at Nevermore Academy.",
        imdbId: "tt13443470",
        seasonsCount: 1,
        episodesCount: 8,
        episodesPerSeason: [8],
        poster: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&q=80&w=600",
        banner: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&q=80&w=1200"
      }
    ];

    const results = mockList.filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase()) || 
      item.overview.toLowerCase().includes(query.toLowerCase()) ||
      item.genres.some(g => g.toLowerCase().includes(query.toLowerCase()))
    );

    res.json({ 
      results, 
      warning: "You are exploring in Local Offline Preview mode. To search the entire worldwide IMDB/Anime catalog, please add your GEMINI_API_KEY in the Secrets menu." 
    });
  }
});

// Setup Vite Dev Server / Static Hosting Middleware
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static hosting
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server bound and active on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Express startup crashed", err);
});
