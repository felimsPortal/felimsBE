import express from "express";
import {
  discoverMedia,
  fetchMoviesByLanguageAndGenre,
} from "../services/tmdbServices.js";
import { getUserByFirebaseUid } from "../models/userModels.js";
import { createUserMovieList } from "../models/movieModels.js";

const movieRoutes = express.Router();

movieRoutes.post("/:firebaseUid/movies", async function (req, res) {
  try {
    const firebaseUid = req.params.firebaseUid;
    const { display_name, languages, genres } = req.body;

    const movieData = {
      display_name,
      languages,
      genres,
    };

    const result = await createUserMovieList(firebaseUid, movieData);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error saving movie profile:", error);
    res.status(500).json({ error: "Failed to save movie profile" });
  }
});

movieRoutes.get("/discover", async (req, res) => {
  const { type = "movie", query = "" } = req.query;

  try {
    const results = await discoverMedia(type, query);
    res.json({ results });
  } catch (error) {
    console.error("Error fetching discovery results:", error);
    res.status(500).json({ error: "Failed to fetch discovery results" });
  }
});

movieRoutes.get("/:firebaseUid", async (req, res) => {
  const firebaseUid = req.params.firebaseUid;

  try {
    const user = await getUserByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const display_name = user.display_name;
    const genres = user.moviePreferences.genres;
    const languages = user.moviePreferences.languages;
    if (
      genres.length === 0 ||
      languages.length === 0 ||
      display_name.length === 0
    ) {
      return res
        .status(400)
        .json({ error: "User has not selected any genres or languages" });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.page_size, 10) || 20;

    const allMovies = (
      await Promise.all(
        languages.map((lang) =>
          fetchMoviesByLanguageAndGenre(lang, genres, page)
        )
      )
    ).flat();

    const uniqueMovies = Array.from(
      new Map(allMovies.map((movie) => [movie.id, movie])).values()
    );

    const paginatedMovies = uniqueMovies.slice(
      (page - 1) * pageSize,
      page * pageSize
    );

    res.json({
      movies: paginatedMovies,
      total_pages: Math.ceil(uniqueMovies.length / pageSize),
      total_results: uniqueMovies.length,
    });
  } catch (error) {
    console.error("Error fetching movies:", error);
    res.status(500).json({ error: "Failed to fetch movies" });
  }
});

export default movieRoutes;
