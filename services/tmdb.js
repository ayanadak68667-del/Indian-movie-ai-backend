import axios from "axios";

const TMDB_BASE = "https://api.themoviedb.org/3";
const API_KEY = process.env.TMDB_API_KEY;

// Axios instance
const tmdb = axios.create({
  baseURL: TMDB_BASE,
  params: {
    api_key: API_KEY,
  },
});

/* =========================
   🇮🇳 INDIAN CONTENT
========================= */

// 🔥 Trending Indian Movies
export const getTrendingIndianMovies = async () => {
  const { data } = await tmdb.get("/trending/movie/week", {
    params: {
      region: "IN",
      with_original_language: "hi",
    },
  });
  return data.results;
};

// 📺 Popular Indian Web Series
export const getIndianWebSeries = async () => {
  const { data } = await tmdb.get("/discover/tv", {
    params: {
      region: "IN",
      with_original_language: "hi",
      sort_by: "popularity.desc",
    },
  });
  return data.results;
};

// ⭐ Top Rated Indian Movies
export const getTopRatedIndianMovies = async () => {
  const { data } = await tmdb.get("/discover/movie", {
    params: {
      region: "IN",
      with_original_language: "hi",
      sort_by: "vote_average.desc",
      vote_count_gte: 100,
    },
  });
  return data.results;
};

// 📅 Upcoming Indian Movies
export const getUpcomingIndianMovies = async () => {
  const { data } = await tmdb.get("/movie/upcoming", {
    params: {
      region: "IN",
    },
  });
  return data.results;
};

/* =========================
   🎬 DETAILS
========================= */

// Movie / TV details
export const getDetails = async (type, id) => {
  const { data } = await tmdb.get(`/${type}/${id}`);
  return data;
};

// Credits
export const getCredits = async (type, id) => {
  const { data } = await tmdb.get(`/${type}/${id}/credits`);
  return data;
};

/* =========================
   📺 OTT
========================= */

export const getWatchProviders = async (type, id) => {
  const { data } = await tmdb.get(`/${type}/${id}/watch/providers`);
  return data.results?.IN || null;
};
