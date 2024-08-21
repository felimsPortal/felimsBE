import express from "express";
import axios from "axios";
import { getUserById } from "../models/userModels.js";
import { createUserMovieList } from "../models/movieModels.js";

const movieRoutes = express.Router();

movieRoutes.post("/:id/movies", async function (req, res) {
  console.log("Request Body:", req.body);
  console.log("Request Params:", req.params);

  try {
    const userId = req.params.id;
    const { languages, genres } = req.body;

    const newMovieProfile = {
      user_id: userId,
      languages,
      genres,
    };

    const result = await createUserMovieList(newMovieProfile);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error saving movie profile:", error);
    res.status(500).json({ error: "Failed to save movie profile" });
  }
});

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = process.env.BASE_URI;
const IMAGES_URI = process.env.IMAGES_URI;
const MIN_VOTE_COUNT = 10;

const fetchMoviesByLanguageAndGenre = async (language, genres, page = 1) => {
  const url = `${TMDB_BASE_URL}discover/movie`;

  console.log("Requesting movies from TMDB with the following parameters:");
  console.log("API Key:", TMDB_API_KEY);
  console.log("Sort By:", "primary_release_date.desc");
  console.log("Language:", language);
  console.log("Genres:", genres.join(","));
  console.log("Page:", page);
  console.log("Minimum Vote Count:", MIN_VOTE_COUNT);

  try {
    const response = await axios.get(url, {
      params: {
        api_key: TMDB_API_KEY,
        sort_by: "primary_release_date.desc",
        with_original_language: language,
        page: page,
        "vote_count.gte": MIN_VOTE_COUNT,
        with_genres: genres.join(","),
      },
    });

    console.log("TMDB API Response:", response.data.results);
    if (!response.data.results) {
      console.error("No 'results' property in response:", response.data);
      return [];
    }

    return response.data.results
      .filter((movie) => movie.poster_path !== null)
      .map((movie) => {
        // Store values in variables
        const id = movie.id;
        const title = movie.title;
        const overview = movie.overview;
        const release_date = movie.release_date;
        const vote_average = movie.vote_average;
        const original_language = movie.original_language;

        return {
          id,
          title,
          overview,
          release_date,
          vote_average,
          original_language,
          poster_path: movie.poster_path
            ? `${IMAGES_URI}${movie.poster_path}`
            : null,
        };
      });
  } catch (error) {
    console.error(`Error fetching movies for language ${language}:`, error);
    return [];
  }
};

movieRoutes.get("/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  console.log(`Received request for userId: ${userId}`);
  console.log(
    `Query parameters: page=${req.query.page}, page_size=${req.query.page_size}`
  );
  if (isNaN(userId)) {
    console.error("Invalid user ID:", req.params.userId);
    return res.status(400).json({ error: "Invalid user ID" });
  }

  try {
    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const genres = user.genres;
    const languages = user.languages;

    if (genres.length === 0 || languages.length === 0) {
      return res.status(400).json({
        error: "User has not selected any genres or languages",
      });
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
