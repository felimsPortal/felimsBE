import express from "express";
// import {

// } from "../services/tmdbServices.js";
import { getUserByFirebaseUid } from "../models/userModels.js";
import {
  createUserMovieList,
  getUserMoviePreferences,
} from "../models/movieModels.js";
import {
  discoverMedia,
  fetchMoviesByLanguageAndGenre,
  discoverDocumentaries,
  fetchMoviesByLanguage,
  fetchLatestMovies,
  fetchLatestTVShows,
} from "../services/tmdbServices.js";

const movieRoutes = express.Router();

movieRoutes.get("/latest", async (req, res) => {
  const { page = 1 } = req.query;

  try {
    const result = await fetchLatestMovies(page);
    res.json({
      movies: result.movies,
      total_pages: result.total_pages,
      total_results: result.total_results,
    });
  } catch (error) {
    console.error("Error fetching latest movies:", error);
    res.status(500).json({ error: "Failed to fetch latest movies" });
  }
});

movieRoutes.get("/latest-tv", async (req, res) => {
  const { page = 1 } = req.query;

  try {
    const result = await fetchLatestTVShows(page);

    // Log the actual result to the server console
    console.log("TV Shows data:", JSON.stringify(result, null, 2)); // Pretty print JSON

    res.json({
      tvShows: result.tvShows,
      total_pages: result.total_pages,
      total_results: result.total_results,
    });
  } catch (error) {
    console.error("Error fetching latest TV shows:", error);
    res.status(500).json({ error: "Failed to fetch latest TV shows" });
  }
});

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

movieRoutes.get("/discover/genre", async (req, res) => {
  const { page = 1 } = req.query;

  try {
    const documentariesData = await discoverDocumentaries("", page);
    console.log("Documentaries Data Sent to Client:", documentariesData); // Log the final response structure
    res.json({ results: documentariesData });
  } catch (error) {
    console.error("Error fetching discovery results:", error);
    res.status(500).json({ error: "Failed to fetch discovery results" });
  }
});

// movieRoutes.get("/discover/genre", async (req, res) => {
//   const { query = "", page = 1 } = req.query;

//   try {
//     const results = await discoverDocumentaries(query, page); // Use the new function
//     res.json({ results });
//   } catch (error) {
//     console.error("Error fetching documentary results:", error);
//     res.status(500).json({ error: "Failed to fetch documentary results" });
//   }
// });

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

    if (genres.length === 0 || languages.length === 0 || display_name === 0) {
      return res
        .status(400)
        .json({ error: "User has not selected any genres or languages" });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.page_size, 10) || 20;
    let combinedMovies = [];
    let total_pages = 0;
    let total_results = 0;

    for (let lang of languages) {
      for (let i = page; i < page + 5; i++) {
        // Fetch next 5 pages
        const {
          movies,
          total_pages: langTotalPages,
          total_results: langTotalResults,
        } = await fetchMoviesByLanguageAndGenre(lang, genres, i);
        combinedMovies = [...combinedMovies, ...movies];
        total_pages = Math.max(total_pages, langTotalPages);
        total_results += langTotalResults;
      }
    }

    const uniqueMovies = Array.from(
      new Map(combinedMovies.map((movie) => [movie.id, movie])).values()
    );

    const paginatedMovies = uniqueMovies.slice(
      (page - 1) * pageSize,
      page * pageSize
    );

    res.json({
      display_name,
      movies: paginatedMovies,
      total_pages: total_pages,
      // total_pages: Math.ceil(uniqueMovies.length / pageSize),
      total_results: uniqueMovies.length,
    });
  } catch (error) {
    console.error("Error fetching movies:", error);
    res.status(500).json({ error: "Failed to fetch movies" });
  }
});

movieRoutes.get("/language/:firebaseUid", async (req, res) => {
  try {
    const firebaseUid = req.params.firebaseUid;
    const { page } = req.query;

    // Fetch the user's movie preferences, including their preferred languages
    const userPreferences = await getUserMoviePreferences(firebaseUid);

    if (!userPreferences || userPreferences.languages.length === 0) {
      return res
        .status(404)
        .json({ error: "No preferred language found for this user" });
    }

    // Fetch movies and TV shows for each language
    const results = [];

    for (const language of userPreferences.languages) {
      const result = await fetchMoviesByLanguage(language, page || 1);
      results.push(...result.movies); // Collect movies
      // You could also fetch TV shows in a similar manner if needed
    }

    res.status(200).json({ movies: results });
  } catch (error) {
    console.error("Error fetching preferred language or movies:", error);
    res.status(500).json({ error: "Failed to fetch movies by language" });
  }
});

export default movieRoutes;
