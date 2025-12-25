// services/tmdbService.js
const fetch = require('node-fetch');

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const REGION_IN = 'IN';
const LANGUAGE_EN = 'en-US';

// ভবিষ্যতে চাইলে আলাদা আলাদা language filter অ্যাড করতে পারো
const INDIAN_LANGS = ['hi', 'te', 'ta', 'ml', 'kn', 'bn'];

if (!TMDB_API_KEY) {
  console.error('TMDB_API_KEY is missing in environment variables');
}

/** helper: common fetch */
async function tmdbRequest(path, params = {}) {
  const url = new URL(`${TMDB_BASE_URL}${path}`);
  url.searchParams.set('api_key', TMDB_API_KEY);
  url.searchParams.set('language', LANGUAGE_EN);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  });

  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('TMDB error:', res.status, text);
    throw new Error(`TMDB request failed: ${res.status}`);
  }
  return res.json();
}

/** 1. Home page lists – PURE INDIAN FOCUS */

// Trending Indian movies (discover + origin_country=IN)
async function getTrendingMovies() {
  const data = await tmdbRequest('/discover/movie', {
    with_origin_country: REGION_IN,
    sort_by: 'popularity.desc',
    'vote_count.gte': 50,
    include_adult: false,
    page: 1
  });
  return data.results || [];
}

// Popular Indian web series
async function getPopularWebSeries() {
  const data = await tmdbRequest('/discover/tv', {
    with_origin_country: REGION_IN,
    sort_by: 'popularity.desc',
    'vote_count.gte': 50,
    include_adult: false,
    page: 1
  });
  return data.results || [];
}

// Top rated Indian movies (IMDB‑style feel)
async function getTopRatedMovies() {
  const data = await tmdbRequest('/discover/movie', {
    with_origin_country: REGION_IN,
    sort_by: 'vote_average.desc',
    'vote_count.gte': 200,
    include_adult: false,
    page: 1
  });
  return data.results || [];
}

// Upcoming Indian movies (release date based)
async function getUpcomingMovies() {
  const today = new Date().toISOString().slice(0, 10);
  const data = await tmdbRequest('/discover/movie', {
    with_origin_country: REGION_IN,
    'primary_release_date.gte': today,
    sort_by: 'primary_release_date.asc',
    include_adult: false,
    page: 1
  });
  return data.results || [];
}

/** 2. Single movie details + credits + images + providers */

async function getMovieDetails(movieId) {
  const data = await tmdbRequest(`/movie/${movieId}`, {
    append_to_response: 'keywords,images',
    include_image_language: 'en,null'
  });
  return data;
}

async function getMovieCredits(movieId) {
  const data = await tmdbRequest(`/movie/${movieId}/credits`);
  return data;
}

async function getMovieWatchProviders(movieId) {
  const data = await tmdbRequest(`/movie/${movieId}/watch/providers`);
  return data.results ? data.results[REGION_IN] || null : null;
}

async function getMovieRecommendations(movieId) {
  const data = await tmdbRequest(`/movie/${movieId}/recommendations`, {
    with_origin_country: REGION_IN
  });
  // recommendation লিস্টেও আগে Indian গুলোকে অগ্রাধিকার দিতে চাইলে এখানেও ফিল্টার করতে পারো
  return data.results || [];
}

/** 3. Helper to build clean payload for frontend */

function buildCastWithImages(credits, limit = 10) {
  if (!credits || !Array.isArray(credits.cast)) return [];
  return credits.cast
    .filter(person => person.profile_path)
    .slice(0, limit)
    .map(person => ({
      id: person.id,
      name: person.name,
      character: person.character,
      profileUrl: `https://image.tmdb.org/t/p/w185${person.profile_path}`
    }));
}

function buildMovieCardList(list) {
  if (!Array.isArray(list)) return [];
  return list.map(item => ({
    id: item.id,
    title: item.title || item.name,
    overview: item.overview,
    posterUrl: item.poster_path
      ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
      : null,
    backdropUrl: item.backdrop_path
      ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}`
      : null,
    voteAverage: item.vote_average,
    releaseDate: item.release_date || item.first_air_date
  }));
}

module.exports = {
  getTrendingMovies,
  getPopularWebSeries,
  getTopRatedMovies,
  getUpcomingMovies,
  getMovieDetails,
  getMovieCredits,
  getMovieWatchProviders,
  getMovieRecommendations,
  buildCastWithImages,
  buildMovieCardList
};
