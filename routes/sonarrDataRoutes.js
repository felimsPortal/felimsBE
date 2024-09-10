import express from "express";
import {
  fetchTvShowByTmdbId,
  downloadEpisode,
  //   getTvdbIdFromTmdbId,
} from "../controllers/sonarrController.js";

const router = express.Router();

// Route to fetch TV show details by TMDB ID
router.get("/tvshows/:tmdbId", async (req, res) => {
  const { tmdbId } = req.params;

  try {
    const tvShow = await fetchTvShowByTmdbId(tmdbId);
    if (!tvShow) {
      return res.status(404).json({ error: "TV show not found" });
    }
    res.json(tvShow);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.post("/download-episode", downloadEpisode);

// router.get("/convert-tmdb-to-tvdb/:tmdbId", getTvdbIdFromTmdbId);

export default router;
