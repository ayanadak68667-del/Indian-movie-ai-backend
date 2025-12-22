// services/geminiService.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is missing");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// ✅ ONLY WORKING MODEL (2025)
const MODEL_NAME = "gemini-1.5-pro-latest";

function buildMovieReviewPrompt(movie, credits, providers, recommendations) {
  const title = movie.title || movie.name || "Unknown Title";
  const year = (movie.release_date || movie.first_air_date || "").slice(0, 4);
  const genres = (movie.genres || []).map(g => g.name).join(", ") || "N/A";
  const overview = movie.overview || "No overview available.";
  const budget = movie.budget || 0;
  const revenue = movie.revenue || 0;
  const voteAverage = movie.vote_average || 0;
  const voteCount = movie.vote_count || 0;

  const cast = credits?.cast?.slice(0, 8) || [];
  const castLines = cast
    .map(c => `- ${c.name} as ${c.character || "Unknown"}`)
    .join("\n");

  const providerNames = providers?.flatrate
    ? providers.flatrate.map(p => p.provider_name).join(", ")
    : "No official streaming info";

  const recTitles = Array.isArray(recommendations)
    ? recommendations.slice(0, 6).map(r => r.title || r.name).join(", ")
    : "No recommendation data";

  return `
You are a professional English movie critic and SEO writer.

Movie:
Title: ${title}
Year: ${year}
Genres: ${genres}
Rating: ${voteAverage}/10 from ${voteCount} votes
Budget: ${budget}
Revenue: ${revenue}

Overview (reference only):
"${overview}"

Cast:
${castLines || "No cast data"}

Streaming platforms:
${providerNames}

Similar titles:
${recTitles}

Write a structured English movie review with natural, human tone.
Do not mention AI.
Do not invent data.
`;
}

async function generateMovieBlog({ movie, credits, providers, recommendations }) {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME
  });

  const prompt = buildMovieReviewPrompt(
    movie,
    credits,
    providers,
    recommendations
  );

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  return { blogText: text };
}

module.exports = { generateMovieBlog };
