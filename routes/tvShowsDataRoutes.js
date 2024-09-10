import express from "express";
import {
  discoverMedia,
  fetchTvShowsWithSeasons,
  fetchEpisodesBySeason,
} from "../services/tmdbServices.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const { query, page = 1 } = req.query; // Get query and page from request

  try {
    const tvShowsData = await discoverMedia("tv", query, page); // Fetch TV shows with TMDB service
    res.status(200).json(tvShowsData); // Send the response
  } catch (error) {
    console.error("Error fetching TV shows:", error);
    res.status(500).json({ error: "Error fetching TV shows." });
  }
});

// Route to fetch a specific TV show with seasons
router.get("/:tvShowId", async (req, res) => {
  const { tvShowId } = req.params;
  const { page = 1 } = req.query; // Get page from query if necessary

  try {
    const tvShowWithSeasons = await fetchTvShowsWithSeasons(tvShowId, page); // Fetch TV show details
    if (!tvShowWithSeasons) {
      return res
        .status(404)
        .json({ error: "TV show not found or has no valid seasons." });
    }
    res.status(200).json(tvShowWithSeasons); // Send TV show details as a response
  } catch (error) {
    console.error("Error fetching TV show details:", error);
    res.status(500).json({ error: "Error fetching TV show details." });
  }
});

router.get("/:tvShowId/season/:seasonNumber", (req, res, next) => {
  const { tvShowId, seasonNumber } = req.params;

  console.log(
    `Fetching episodes for TV show ID: ${tvShowId}, Season: ${seasonNumber}`
  );

  // Ensure the params are correct
  console.log("Received tvShowId:", tvShowId);
  console.log("Received seasonNumber:", seasonNumber);

  fetchEpisodesBySeason(tvShowId, seasonNumber)
    .then((seasonDetails) => {
      if (!seasonDetails) {
        console.log("No season details found.");
        return res.status(404).json({ error: "Season or episodes not found." });
      }

      console.log("Season details found, sending response.");
      res.status(200).json(seasonDetails); // Send season details, including episodes
    })
    .catch((error) => {
      console.error("Error fetching episodes:", error);
      res.status(500).json({ error: "Error fetching episodes." });
    });
});

export default router;
