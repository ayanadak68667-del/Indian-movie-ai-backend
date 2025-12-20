// routes/movie.js
const express = require('express');
const router = express.Router();

const {
  getMovieDetails,
  getMovieCredits,
  getMovieWatchProviders,
  getMovieRecommendations,
  buildCastWithImages,
  buildMovieCardList
} = require('../services/tmdbService');

const { getOfficialTrailer } = require('../services/youtubeService');
const { generateMovieBlog } = require('../services/geminiService');

// helper: পুরো details payload বানানো
async function buildMovieFullPayload(movieId) {
  const [movie, credits, providers, recommendations] = await Promise.all([
    getMovieDetails(movieId),
    getMovieCredits(movieId),
    getMovieWatchProviders(movieId),
    getMovieRecommendations(movieId)
  ]);

  const cast = buildCastWithImages(credits, 12);
  const recCards = buildMovieCardList(recommendations);

  const heroBackdrop = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
    : null;

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null;

  return {
    movie: {
      id: movie.id,
      title: movie.title || movie.name,
      overview: movie.overview,
      posterUrl,
      heroBackdrop,
      genres: movie.genres || [],
      runtime: movie.runtime,
      releaseDate: movie.release_date || movie.first_air_date,
      voteAverage: movie.vote_average,
      voteCount: movie.vote_count,
      budget: movie.budget,
      revenue: movie.revenue,
      originalLanguage: movie.original_language,
      homepage: movie.homepage
    },
    cast,
    providers,
    recommendations: recCards
  };
}

// GET /api/movie/:id  -> basic full details (without AI)
router.get('/:id', async (req, res) => {
  try {
    const movieId = req.params.id;
    const payload = await buildMovieFullPayload(movieId);
    res.json(payload);
  } catch (err) {
    console.error('Error in GET /api/movie/:id', err.message || err);
    res.status(500).json({ error: 'Failed to load movie details' });
  }
});

// GET /api/movie/:id/trailer  -> YouTube trailer
router.get('/:id/trailer', async (req, res) => {
  try {
    const movieId = req.params.id;
    const movie = await getMovieDetails(movieId);

    const title = movie.title || movie.name;
    const year = (movie.release_date || movie.first_air_date || '').slice(0, 4);

    const trailer = await getOfficialTrailer(title, year);
    if (!trailer) {
      return res.status(404).json({ error: 'Trailer not found' });
    }

    res.json({
      ...trailer,
      embedUrl: `https://www.youtube.com/embed/${trailer.videoId}`
    });
  } catch (err) {
    console.error('Error in GET /api/movie/:id/trailer', err.message || err);
    res.status(500).json({ error: 'Failed to load trailer' });
  }
});

// GET /api/movie/:id/blog  -> Gemini AI ব্লগ + স্মার্ট সেকশন
router.get('/:id/blog', async (req, res) => {
  try {
    const movieId = req.params.id;

    const [movie, credits, providers, recommendations] = await Promise.all([
      getMovieDetails(movieId),
      getMovieCredits(movieId),
      getMovieWatchProviders(movieId),
      getMovieRecommendations(movieId)
    ]);

    const aiResult = await generateMovieBlog({
      movie,
      credits,
      providers,
      recommendations
    });

    res.json({
      blogText: aiResult.blogText
    });
  } catch (err) {
    console.error('Error in GET /api/movie/:id/blog', err.message || err);
    res.status(500).json({ error: 'Failed to generate AI blog' });
  }
});

module.exports = router;
