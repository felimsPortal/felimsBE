import express from "express";
import axios from "axios";

const router = express.Router();
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3/discover/movie";
const IMAGES_URI = "https://image.tmdb.org/t/p/w500";

router.get("/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) {
    console.error("Invalid user ID:", req.params.userId);
    return res.status(400).json({ error: "Invalid user ID" });
  }

  try {
    const userResponse = await axios.get(
      `http://localhost:3001/api/movies/${userId}`
    );
    const userData = userResponse.data;

    const genres = Array.isArray(userData.genres) ? userData.genres : [];
    const languages = Array.isArray(userData.languages)
      ? userData.languages
      : [];
    const genresParam = genres.join(",");
    const languagesParam = languages.join(",");

    const url = `${TMDB_BASE_URL}?api_key=${TMDB_API_KEY}&sort_by=vote_average.desc&with_genres=${genresParam}&with_original_language=${languagesParam}`;

    const tmdbResponse = await axios.get(url);
    const movies = tmdbResponse.data.results
      .filter((movie) => movie.poster_path !== null)
      .map((movie) => ({
        id: movie.id,
        title: movie.title,
        poster_path: `${IMAGES_URI}${movie.poster_path}`,
      }));

    res.json({ movies });
  } catch (error) {
    console.error("Error fetching movies from TMDB:", error);
    res.status(500).json({ error: "Failed to fetch movies from TMDB" });
  }
});

export default router;
