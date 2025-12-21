// services/geminiService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is missing in environment variables');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Model name
const MODEL_NAME = 'gemini-1.5-flash';

function buildMovieReviewPrompt(movie, credits, providers, recommendations) {
  const title = movie.title || movie.name || 'Unknown Title';
  const year = (movie.release_date || movie.first_air_date || '').slice(0, 4);
  const genres = (movie.genres || []).map(g => g.name).join(', ') || 'N/A';
  const overview = movie.overview || 'No overview available.';
  const budget = movie.budget || 0;
  const revenue = movie.revenue || 0;
  const voteAverage = movie.vote_average || 0;
  const voteCount = movie.vote_count || 0;

  const cast = credits?.cast ? credits.cast.slice(0, 8) : [];
  const castLines = cast
    .map(c => `- ${c.name} as ${c.character || 'Unknown'}`)
    .join('\n');

  const providerNames = providers?.flatrate
    ? providers.flatrate.map(p => p.provider_name).join(', ')
    : 'No official streaming info';

  const recTitles = Array.isArray(recommendations)
    ? recommendations.slice(0, 6).map(r => r.title || r.name).join(', ')
    : 'No recommendation data.';

  return `
You are a professional English movie critic and SEO writer.
Write content in natural, human-like English.

Movie basic info:
- Title: ${title}
- Year: ${year}
- Genres: ${genres}
- IMDB-style rating (from TMDB): ${voteAverage} / 10 from ${voteCount} votes
- Budget (USD): ${budget}
- Box office / Revenue (USD): ${revenue}

Short overview from TMDB (for reference only):
"${overview}"

Main cast:
${castLines || 'No cast data.'}

Streaming / OTT providers (India region):
${providerNames}

Similar or related titles:
${recTitles}

Create a structured review with clear sections:
1. Movie Synopsis
2. Box Office & Budget Analysis
3. Pros & Cons
4. Why You Should Watch This Movie
5. Main Actor Performance Analysis
6. Character Descriptions
7. Target Audience
8. Language & Style

Rules:
- English only
- Do NOT mention you are an AI
- Do NOT invent numbers
- Skip missing data gracefully
`;
}

async function generateMovieBlog({ movie, credits, providers, recommendations }) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  const prompt = buildMovieReviewPrompt(movie, credits, providers, recommendations);

  const result = await model.generateContent(prompt);
  const response = await result.response;

  return {
    blogText: response.text()
  };
}

module.exports = {
  generateMovieBlog
};
