// services/tmdbService.js
const fetch = require('node-fetch');

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const REGION_IN = 'IN';
const LANGUAGE_EN = 'en-US';

if (!TMDB_API_KEY) {
  console.error('TMDB_API_KEY is missing in environment variables');
}

/** helper: common fetch */
async function tmdbRequest(path, params = {}) {
  const url = new URL(`${TMDB_BASE_URL}${path}`);
  url.searchParams.set('api_key', TMDB_API_KEY);
  url.searchParams.set('language', LANGUAGE_EN);

  // extra query params
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

/** 1. Home page lists */

// Trending Indian movies (day)
async function getTrendingMovies() {
  const data = await tmdbRequest('/trending/movie/day', {
    region: REGION_IN
  });
  return data.results || [];
}

// Popular Indian web series
async function getPopularWebSeries() {
  const data = await tmdbRequest('/tv/popular', {
    region: REGION_IN
  });
  return data.results || [];
}

// Top IMDb‑style rated movies (high vote_average + vote_count)
async function getTopRatedMovies() {
  const data = await tmdbRequest('/movie/top_rated', {
    region: REGION_IN
  });
  return data.results || [];
}

// Upcoming Indian movies
async function getUpcomingMovies() {
  const data = await tmdbRequest('/movie/upcoming', {
    region: REGION_IN
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
  // we care mostly about region IN
  return data.results ? data.results[REGION_IN] || null : null;
}

async function getMovieRecommendations(movieId) {
  const data = await tmdbRequest(`/movie/${movieId}/recommendations`, {
    region: REGION_IN
  });
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
