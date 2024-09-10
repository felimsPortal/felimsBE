import express from "express";
import axios from "axios";
import { fetchYoutubeTrailerForTvShow } from "../services/tmdbServices.js";

const router = express.Router();
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const IMAGES_URI = "https://image.tmdb.org/t/p/w500";

router.get("/:firebaseUid", async (req, res) => {
  const firebaseUid = req.params.firebaseUid;

  try {
    const userResponse = await axios.get(
      `http://localhost:3001/api/userdata/${firebaseUid}`
    );
    const userData = userResponse.data;

    const displayName = userData.display_name;

    const genres = Array.isArray(userData.moviePreferences.genres)
      ? userData.moviePreferences.genres
      : [];
    const languages = Array.isArray(userData.moviePreferences.languages)
      ? userData.moviePreferences.languages
      : [];
    const genresParam = genres.join(",");
    const languagesParam = languages.join(",");

    // Fetch movies
    const moviesUrl = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&sort_by=vote_average.desc&with_genres=${genresParam}&with_original_language=${languagesParam}`;
    const moviesResponse = await axios.get(moviesUrl);

    // Filter and map movie results
    const movies = moviesResponse.data.results
      .filter((movie) => movie.poster_path !== null)
      .map((movie) => ({
        id: movie.id,
        title: movie.title,
        poster_path: `${IMAGES_URI}${movie.poster_path}`,
      }));

    // Fetch TV shows
    const tvUrl = `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&sort_by=vote_average.desc&with_genres=${genresParam}&with_original_language=${languagesParam}`;
    const tvResponse = await axios.get(tvUrl);

    // Filter and map TV show results
    const tvShows = tvResponse.data.results
      .filter((tvShow) => tvShow.poster_path !== null)
      .map((tvShow) => ({
        id: tvShow.id,
        title: tvShow.name, // TV shows use 'name' instead of 'title'
        poster_path: `${IMAGES_URI}${tvShow.poster_path}`,
      }));

    // Combine movies and TV shows
    const combinedResults = [...movies, ...tvShows];

    // Log the final results
    console.log("Final combined results:", combinedResults);

    res.json({ display_name: displayName, results: combinedResults });
  } catch (error) {
    console.error("Error fetching movies from TMDB:", error);
    res.status(500).json({ error: "Failed to fetch movies from TMDB" });
  }
});

router.get("/tv/:tvShowId/trailer", async (req, res) => {
  const { tvShowId } = req.params;

  try {
    const youtubeTrailerId = await fetchYoutubeTrailerForTvShow(tvShowId);

    if (youtubeTrailerId) {
      res.json({ youtubeTrailerId });
    } else {
      res.status(404).json({ error: "YouTube trailer not found" });
    }
  } catch (error) {
    console.error("Error in /tv/:tvShowId/trailer route:", error.message);
    res.status(500).json({ error: "Failed to fetch YouTube trailer" });
  }
});

export default router;
