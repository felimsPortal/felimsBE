import express from "express";
import axios from "axios";
import { fetchMovieByTmdbId } from "../controllers/radarrController.js";

const router = express.Router();

router.get("/movies/:tmdbId", async (req, res) => {
  const { tmdbId } = req.params;

  try {
    const movie = await fetchMovieByTmdbId(tmdbId);
    res.json(movie);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/download", async (req, res) => {
  const { tmdbId } = req.body;

  if (!tmdbId) {
    return res.status(400).json({ error: "TMDB ID is required" });
  }

  try {
    console.log("TMDB ID received in request:", tmdbId);

    const radarrApiUrl = `${process.env.RADARR_BASE_URL}/movie`;
    const radarrApiKey = process.env.RADARR_API_KEY;

    const movieDetails = {
      title: "Movie Title", // You might need to fetch this from TMDB or Radarr
      qualityProfileId: 1, // Example ID, should match a valid profile in your Radarr setup
      tmdbId: tmdbId,
      titleSlug: tmdbId.toString(),
      images: [],
      year: 2024, // This should match the movie's release year
      rootFolderPath: "D:\\Radarr-Movies", // Update with the correct path
      monitored: true,
      minimumAvailability: "released",
      addOptions: {
        searchForMovie: true,
      },
    };
    console.log("Sending the following data to Radarr:", movieDetails);

    // Add movie to Radarr
    const response = await axios.post(radarrApiUrl, movieDetails, {
      headers: {
        "X-Api-Key": radarrApiKey,
      },
    });

    console.log("Radarr API response:", response.data);
    res.status(200).json({ message: "Movie added to download queue" });
  } catch (error) {
    console.error(
      "Error adding movie to Radarr:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "Failed to add movie to Radarr" });
  }
});

export default router;
