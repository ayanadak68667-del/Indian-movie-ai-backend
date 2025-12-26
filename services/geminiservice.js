// services/geminiService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is missing in environment variables');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// কোন মডেল ইউজ করবে
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

  const cast = (credits && credits.cast) ? credits.cast.slice(0, 8) : [];
  const castLines = cast.map(
    c => `- ${c.name} as ${c.character || 'Unknown'}`
  ).join('
');

  const providerNames = providers && providers.flatrate
    ? providers.flatrate.map(p => p.provider_name).join(', ')
    : 'No official streaming info';

  const recTitles = Array.isArray(recommendations)
    ? recommendations.slice(0, 6).map(r => r.title || r.name).join(', ')
    : '';

  return `
You are a professional English movie critic and SEO writer. 
Write content in natural, human-like English. Avoid repeating the same sentence structure.

Movie basic info:
- Title: ${title}
- Year: ${year}
- Genres: ${genres}
- IMDB-style rating (from TMDB): ${voteAverage} / 10 from ${voteCount} votes
- Budget (USD): ${budget}
- Box office / Revenue (USD): ${revenue}

Short overview from TMDB (for your reference, do NOT copy verbatim):
"${overview}"

Main cast:
${castLines || 'No cast data.'}

Streaming / OTT providers (India region):
${providerNames}

Similar or related titles:
${recTitles || 'No recommendation data.'}

Create a structured review article with the following clear sections (use H3-like headings, but no markdown symbols):

1. Movie Synopsis
- 1 short paragraph (3-4 lines) summarizing the story in your own words.

2. Box Office & Budget Analysis
- Explain whether the movie seems like a hit or miss based on budget vs revenue.
- Keep it simple and understandable for normal users.

3. Pros & Cons
- 3 bullet points for Pros.
- 3 bullet points for Cons.
- Focus on story, direction, pacing, music, acting, and visuals.

4. Why You Should Watch This Movie
- 1–2 paragraphs convincing the reader to watch it.
- Use a friendly but informative tone.

5. Main Actor Performance Analysis
- Focus on the lead actor(s).
- Mention their character names.
- Explain what they did well or where they were weak.

6. Character Descriptions
- Briefly describe 3–5 important characters and their role in the story.

7. Target Audience (Who Will Enjoy This?)
- 1 paragraph describing what kind of people will enjoy this movie.
- For example: fans of family drama, dark thrillers, romantic comedies, etc.

8. Language & Style
- Confirm that the review is written in English only.
- Keep the tone cinematic, modern and human-like, not robotic.

Very important rules:
- Language: English only.
- Do NOT mention that you are an AI.
- Do NOT invent technical box office numbers; use the given numbers only.
- If some data is missing, gracefully skip or generalize without lying.
`;
}

async function generateMovieBlog({ movie, credits, providers, recommendations }) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const prompt = buildMovieReviewPrompt(
    movie,
    credits,
    providers,
    recommendations
  );

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  return {
    blogText: text
  };
}

module.exports = {
  generateMovieBlog
};
