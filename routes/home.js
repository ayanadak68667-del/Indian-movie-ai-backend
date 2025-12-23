// routes/home.js
const express = require('express');
const router = express.Router();

const {
  getTrendingMovies,
  getPopularWebSeries,
  getTopRatedMovies,
  getUpcomingMovies,
  buildMovieCardList
} = require('../services/tmdbService');

// GET /api/home
// হোমপেজে চারটা সেকশন: Trending, Web Series, Top Rated, Upcoming
router.get('/home', async (req, res) => {
  try {
    const [trending, webSeries, topRated, upcoming] = await Promise.all([
      getTrendingMovies(),
      getPopularWebSeries(),
      getTopRatedMovies(),
      getUpcomingMovies()
    ]);

    const payload = {
      trending: buildMovieCardList(trending),
      webSeries: buildMovieCardList(webSeries),
      topRated: buildMovieCardList(topRated),
      upcoming: buildMovieCardList(upcoming)
    };

    res.json(payload);
  } catch (err) {
    console.error('Error in /api/home:', err.message || err);
    res.status(500).json({
      error: 'Failed to load home data'
    });
  }
});

module.exports = router;
