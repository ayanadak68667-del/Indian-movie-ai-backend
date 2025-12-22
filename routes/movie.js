// routes/movie.js
const express = require('express');
const router = express.Router();

const {
  getMovieDetails,
  getMovieCredits,
  getMovieWatchProviders,
  getMovieRecommendations
} = require('../services/tmdbService');

const { generateMovieBlog } = require('../services/geminiService');

// 🔹 AI Blog Route
router.get('/:id/blog', async (req, res) => {
  const movieId = req.params.id;

  try {
    // 1️⃣ Fetch TMDB data in parallel
    const [
      movie,
      credits,
      providers,
      recommendations
    ] = await Promise.all([
      getMovieDetails(movieId),
      getMovieCredits(movieId),
      getMovieWatchProviders(movieId),
      getMovieRecommendations(movieId)
    ]);

    // 2️⃣ Generate AI blog
    const blog = await generateMovieBlog({
      movie,
      credits,
      providers,
      recommendations
    });

    // 3️⃣ Success response
    res.json({
      success: true,
      movieId,
      blogText: blog.blogText
    });

  } catch (error) {
    console.error('AI BLOG ERROR:', error.message || error);

    res.status(500).json({
      success: false,
      message: 'Failed to generate movie blog',
      error: error.message
    });
  }
});

module.exports = router;
