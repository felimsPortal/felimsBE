import express from "express";
import axios from "axios";
import { getUserById } from "../models/userModels.js";
import { createUserMovieList } from "../models/movieModels.js";

const movieRoutes = express.Router();
const router = express.Router();

// movieRoutes.get("/", (req, res) => {
//   res.send("Movie routes are working!");
// });

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

// const newMovieProfile = req.body;
// const result = await createUserMovieList(newMovieProfile);
// res.status(200).json(result);
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = process.env.BASE_URI;
const IMAGES_URI = process.env.IMAGES_URI;
const WATCH_PROVIDER_ID = 8;
const MIN_VOTE_COUNT = 10;

const fetchMoviesByLanguageAndGenre = async (language, genres, page = 1) => {
  const url = `${TMDB_BASE_URL}discover/movie`;
  try {
    const response = await axios.get(url, {
      params: {
        api_key: TMDB_API_KEY,
        sort_by: "vote_average.desc",
        with_watch_providers: WATCH_PROVIDER_ID,
        with_original_language: language,
        page: page,
        "vote_count.gte": MIN_VOTE_COUNT,
        with_genres: genres.join(","),
      },
    });

    return response.data.results
      .filter((movie) => movie.poster_path !== null)
      .map((movie) => ({
        id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path
          ? `${IMAGES_URI}${movie.poster_path}`
          : null,
      }));
  } catch (error) {
    console.error(`Error fetching movies for language ${language}:`, error);
    return [];
  }
};

router.get("/:userId", async (req, res) => {
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

    // Get pagination parameters from query
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.page_size, 10) || 20;

    // Fetch movies for all user-selected languages and genres
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

    // Paginate the results
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

// export default router;
export default movieRoutes;

// import express from "express";
// import axios from "axios";
// import { getUserById } from "../models/userModels.js"; // Ensure this import is correct
// import { createMovie } from "../models/movieModels.js"; // Assuming you have this function

// const router = express.Router();
// const TMDB_API_KEY = process.env.TMDB_API_KEY;
// const TMDB_BASE_URL = process.env.BASE_URI;
// const IMAGES_URI = process.env.IMAGES_URI;
// // const WATCH_PROVIDER_ID = 8; // Example watch provider ID
// // const MIN_VOTE_COUNT = 10; // Minimum vote count for movies

// const fetchMoviesByLanguageAndGenre = async (language, genres, page = 1) => {
//   const url = `${TMDB_BASE_URL}discover/movie`;
//   try {
//     const response = await axios.get(url, {
//       params: {
//         api_key: TMDB_API_KEY,
//         sort_by: "vote_average.desc",
//         // with_watch_providers: WATCH_PROVIDER_ID,
//         with_original_language: language,
//         page: page,
//         // "vote_count.gte": MIN_VOTE_COUNT,
//         with_genres: genres.join(","), // Join genres array into a comma-separated string
//       },
//     });

//     return response.data.results
//       .filter((movie) => movie.poster_path !== null)
//       .map((movie) => ({
//         id: movie.id,
//         title: movie.title,
//         poster_path: movie.poster_path
//           ? `${IMAGES_URI}${movie.poster_path}`
//           : null, // Full image URL
//       }));
//   } catch (error) {
//     console.error(`Error fetching movies for language ${language}:`, error);
//     return [];
//   }
// };

// router.get("/:userId", async (req, res) => {
//   const userId = parseInt(req.params.userId, 10);
//   if (isNaN(userId)) {
//     console.error("Invalid user ID:", req.params.userId);
//     return res.status(400).json({ error: "Invalid user ID" });
//   }

//   try {
//     // Fetch user data to get genres and languages
//     const user = await getUserById(userId);

//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     // Assuming user.genres and user.languages are stored as arrays in the database
//     const genres = Array.isArray(user.genres) ? user.genres : [];
//     const languages = Array.isArray(user.languages) ? user.languages : [];

//     if (genres.length === 0 || languages.length === 0) {
//       return res.status(400).json({
//         error: "User has not selected any genres or languages",
//       });
//     }

//     // Fetch movies for all user-selected languages and genres
//     const allMovies = (
//       await Promise.all(
//         languages.map((lang) => fetchMoviesByLanguageAndGenre(lang, genres))
//       )
//     ).flat();

//     // Remove duplicates based on movie ID
//     const uniqueMovies = Array.from(
//       new Map(allMovies.map((movie) => [movie.id, movie])).values()
//     );

//     res.json({
//       movies: uniqueMovies,
//       total_pages: 1, // Dummy value for total pages as it’s not aggregated
//       total_results: uniqueMovies.length,
//     });
//   } catch (error) {
//     console.error("Error fetching movies:", error);
//     res.status(500).json({ error: "Failed to fetch movies" });
//   }
// });

// export default router;

// import express from "express";
// import axios from "axios";

// const router = express.Router();
// const TMDB_API_KEY = process.env.TMDB_API_KEY;
// const TMDB_BASE_URL = process.env.BASE_URI;
// const IMAGES_URI = process.env.IMAGES_URI;
// const WATCH_PROVIDER_ID = 8;
// const LANGUAGES = [
//   "it",
//   "ar",
//   "fr",
//   "de",
//   "es",
//   "ko",
//   "en",
//   "pt",
//   "ru",
//   "zh",
//   "ja",
// ];
// const MIN_VOTE_COUNT = 10;
// const GENRES = [12 || 35 || 99];

// const fetchMoviesByLanguage = async (language, page = 1) => {
//   const url = `${TMDB_BASE_URL}discover/movie`;
//   try {
//     const response = await axios.get(url, {
//       params: {
//         api_key: TMDB_API_KEY,
//         sort_by: "vote_average.desc",
//         with_watch_providers: WATCH_PROVIDER_ID,
//         with_original_language: language,
//         page: page,
//         "vote_count.gte": MIN_VOTE_COUNT,
//         with_genres: GENRES,
//       },
//     });

//     console.log(response.data.results);
//     return response.data.results
//       .filter((movie) => movie.poster_path !== null)
//       .map((movie) => ({
//         id: movie.id,
//         title: movie.title,
//         poster_path: movie.poster_path
//           ? `${IMAGES_URI}${movie.poster_path}`
//           : null, // Full image URL
//       }));
//   } catch (error) {
//     console.error(`Error fetching movies for language ${language}:`, error);
//     return [];
//   }
// };

// router.get("/", async (req, res) => {
//   try {
//     const page = req.query.page || 1;
//     const pageSize = req.query.page_size || 20;

//     // Fetch movies for all languages and merge the results
//     const allMovies = (
//       await Promise.all(
//         LANGUAGES.map((lang) => fetchMoviesByLanguage(lang, page))
//       )
//     ).flat();
//     // Remove duplicates based on movie ID
//     const uniqueMovies = Array.from(
//       new Map(allMovies.map((movie) => [movie.id, movie])).values()
//     );
//     res.json({
//       movies: allMovies,
//       total_pages: 1, // Dummy value for total pages as it’s not aggregated
//       total_results: allMovies.length,
//     });
//   } catch (error) {
//     console.error("Error fetching movies:", error);
//     res.status(500).json({ error: "Failed to fetch movies" });
//   }
// });

// export default router;

// import express from "express";
// import axios from "axios";

// const router = express.Router();
// const TMDB_API_KEY = process.env.TMDB_API_KEY;
// const TMDB_BASE_URL = process.env.BASE_URI;
// const IMAGES_URI = process.env.IMAGES_URI;
// const WATCH_PROVIDER_ID = 8;
// const LANGUAGES = [
//   "it",
//   "ar",
//   "fr",
//   "de",
//   "es",
//   "ko",
//   "en",
//   "pt",
//   "ru",
//   "zh",
//   "ja",
// ];
// const MIN_VOTE_COUNT = 10;

// const fetchMoviesByLanguage = async (language, page = 1) => {
//   const url = `${TMDB_BASE_URL}discover/movie`;
//   try {
//     const response = await axios.get(url, {
//       params: {
//         api_key: TMDB_API_KEY,
//         sort_by: "vote_average.desc",
//         with_watch_providers: WATCH_PROVIDER_ID,
//         with_original_language: language,
//         page: page,
//         "vote_count.gte": MIN_VOTE_COUNT,
//       },
//     });

//     console.log(response.data.results);
//     return response.data.results
//       .filter((movie) => movie.poster_path !== null)
//       .map((movie) => ({
//         id: movie.id,
//         title: movie.title,
//         poster_path: movie.poster_path
//           ? `${IMAGES_URI}${movie.poster_path}`
//           : null,
//       }));
//   } catch (error) {
//     console.error(`Error fetching movies for language ${language}:`, error);
//     return [];
//   }
// };

// router.get("/", async (req, res) => {
//   try {
//     const page = req.query.page || 1;
//     const pageSize = req.query.page_size || 20;
//     const region = req.query.region; // Expect a query parameter to specify region

//     let countryCodes = [];

//     if (region === "Global South") {
//       countryCodes = GLOBAL_SOUTH_COUNTRIES;
//     } else if (region === "Western") {
//       countryCodes = WESTERN_COUNTRIES;
//     }

//     const languageFilters = countryCodes.join("|"); // Join country codes if you want to filter by multiple codes

//     const allMovies = (
//       await Promise.all(
//         LANGUAGES.map((lang) => fetchMoviesByLanguage(lang, page))
//       )
//     ).flat();

//     // Optionally filter allMovies by language or region
//     const filteredMovies = allMovies.filter(
//       (movie) => movie.language && languageFilters.includes(movie.language) // Adjust as needed
//     );

//     // Remove duplicates based on movie ID
//     const uniqueMovies = Array.from(
//       new Map(filteredMovies.map((movie) => [movie.id, movie])).values()
//     );

//     res.json({
//       movies: uniqueMovies,
//       total_pages: 1, // Dummy value for total pages as it’s not aggregated
//       total_results: uniqueMovies.length,
//     });
//   } catch (error) {
//     console.error("Error fetching movies:", error);
//     res.status(500).json({ error: "Failed to fetch movies" });
//   }
// });

// export default router;

// import express, { response } from "express";
// import axios from "axios";

// const router = express.Router();
// const TMDB_API_KEY = process.env.TMDB_API_KEY;
// const TMDB_BASE_URL = process.env.BASE_URI;
// const IMAGES_URI = process.env.IMAGES_URI;
// const WATCH_PROVIDER_ID = 8;
// const ORIGINAL_LANGUAGE = ["it", "fr", "de", "es"];
// const MIN_VOTE_COUNT = 10;

// const fetchMoviesByLanguage = async (language, page = 1) => {
//   const url = `${TMDB_BASE_URL}discover/movie`;
//   try {
//     const response = await axios.get(url, {
//       params: {
//         api_key: TMDB_API_KEY,
//         sort_by: "vote_average.desc",
//         with_watch_providers: WATCH_PROVIDER_ID,
//         with_original_language: language,
//         page: page,
//         "vote_count.gte": MIN_VOTE_COUNT,
//       },
//     });

//     return response.data.results
//       .filter((movie) => movie.poster_path !== null)
//       .map((movie) => ({
//         id: movie.id,
//         title: movie.title,
//         poster_path: movie.poster_path
//           ? `${IMAGES_URI}${movie.poster_path}`
//           : null, // Full image URL
//       }));
//   } catch (error) {
//     console.error(`Error fetching movies for language ${language}:`, error);
//     return [];
//   }
// };

// router.get("/", async (req, res) => {
//   try {
//     const page = req.query.page || 1;
//     const pageSize = req.query.page_size || 20;

//     // Fetch movies for all languages and merge the results
//     const allMovies = (
//       await Promise.all(
//         LANGUAGES.map((lang) => fetchMoviesByLanguage(lang, page))
//       )
//     ).flat();

//     res.json({
//       movies: allMovies,
//       total_pages: 1, // Dummy value for total pages as it’s not aggregated
//       total_results: allMovies.length,
//     });
//   } catch (error) {
//     console.error("Error fetching movies:", error);
//     res.status(500).json({ error: "Failed to fetch movies" });
//   }
// });

// export default router;

// router.get("/", async (req, res) => {
//   try {
//     const page = req.query.page || 1;
//     const pageSize = req.query.page_size || 20;
//     const url = `${TMDB_BASE_URL}discover/movie`;

//     const response = await axios.get(url, {
//       params: {
//         api_key: TMDB_API_KEY,
//         sort_by: "vote_average.desc",
//         with_watch_providers: WATCH_PROVIDER_ID,
//         with_original_language: ORIGINAL_LANGUAGE,
//         page: page,
//         "vote_count.gte": MIN_VOTE_COUNT,
//       },
//     });

//     const moviesWithImages = response.data.results.filter(
//       (movie) => movie.poster_path !== null
//     );

//     const movies = moviesWithImages.map((movie) => ({
//       id: movie.id,
//       title: movie.title,
//       poster_path: movie.poster_path
//         ? `${IMAGES_URI}${movie.poster_path}`
//         : null, // Full image URL
//     }));
//     res.json({
//       movies,
//       total_pages: response.data.total_pages,
//       total_results: response.data.total_results,
//     });
//     console.log(response.data);
//     // res.json(movies);
//   } catch (error) {
//     console.error("Error fetching movies:", error);
//     res.status(500).json({ error: "Failed to fetch movies" });
//   }
// });
