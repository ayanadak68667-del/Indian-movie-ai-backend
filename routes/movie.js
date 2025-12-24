// 🔹 Official trailer route (YouTube embed)
router.get("/movie/:id/trailer", async (req, res) => {
  const movieId = req.params.id;

  try {
    const apiKey = process.env.TMDB_API_KEY;
    const baseUrl = "https://api.themoviedb.org/3";

    const videosRes = await fetch(
      `${baseUrl}/movie/${movieId}/videos?api_key=${apiKey}&language=en-US`
    );

    const videos = await videosRes.json();

    const trailer =
      (videos.results || []).find(
        (v) => v.site === "YouTube" && v.type === "Trailer"
      ) || null;

    if (!trailer) {
      return res.json({
        movie_id: movieId,
        trailerUrl: null
      });
    }

    res.json({
      movie_id: movieId,
      trailerUrl: `https://www.youtube.com/embed/${trailer.key}`
    });
  } catch (err) {
    console.error("TRAILER ERROR:", err);
    res.status(500).json({ error: "Failed to fetch trailer" });
  }
});
