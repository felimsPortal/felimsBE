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
    // Fetch user data to get genres and languages
    const userResponse = await axios.get(
      `http://localhost:3001/api/movies/${userId}`
    );
    const userData = userResponse.data;

    // Check if genres and languages are defined and are arrays
    const genres = Array.isArray(userData.genres) ? userData.genres : [];
    const languages = Array.isArray(userData.languages)
      ? userData.languages
      : [];

    // Construct the query parameters
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

// export default router;

// import express from "express";
// import axios from "axios";

// const router = express.Router();
// const TMDB_API_KEY = process.env.TMDB_API_KEY;
// const TMDB_BASE_URL = "https://api.themoviedb.org/3/discover/movie";
// const IMAGES_URI = "https://image.tmdb.org/t/p/w500";

// router.get("/:userId", async (req, res) => {
//   const userId = parseInt(req.params.userId, 10);

//   // Fetch user data to get genres and languages
//   try {
//     // Example of fetching user data, adjust as per your setup
//     const userResponse = await axios.get(
//       `http://localhost:3001/api/movies/${userId}`
//     );
//     const userData = userResponse.data;

//     const genresParam = userData.genres.join(",");
//     const languagesParam = userData.languages.join(",");

//     const url = `${TMDB_BASE_URL}?api_key=${TMDB_API_KEY}&sort_by=vote_average.desc&with_genres=${genresParam}&with_original_language=${languagesParam}`;

//     const tmdbResponse = await axios.get(url);
//     const movies = tmdbResponse.data.results
//       .filter((movie) => movie.poster_path !== null)
//       .map((movie) => ({
//         id: movie.id,
//         title: movie.title,
//         poster_path: `${IMAGES_URI}${movie.poster_path}`,
//       }));

//     res.json({ movies });
//   } catch (error) {
//     console.error("Error fetching movies from TMDB:", error);
//     res.status(500).json({ error: "Failed to fetch movies from TMDB" });
//   }
// });

// export default router;

// import express from "express";
// import axios from "axios";

// const router = express.Router();
// const TMDB_API_KEY = process.env.TMDB_API_KEY;
// const TMDB_BASE_URL = process.env.BASE_URI;
// const IMAGES_URI = process.env.IMAGES_URI;
// const MIN_VOTE_COUNT = 10;

// // Function to fetch movies by genres and languages
// const fetchMovies = async (genres, languages, page = 1) => {
//   const url = `${TMDB_BASE_URL}discover/movie`;
//   try {
//     const response = await axios.get(url, {
//       params: {
//         api_key: TMDB_API_KEY,
//         sort_by: "vote_average.desc",
//         with_genres: genres.join(","), // Join genres with comma for URL encoding
//         with_original_language: languages.join(","), // Join languages with comma for URL encoding
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
//           : null, // Full image URL
//       }));
//   } catch (error) {
//     console.error(`Error fetching movies:`, error);
//     return [];
//   }
// };

// // Route to fetch movies based on user preferences
// router.get("/:userId", async (req, res) => {
//   const userId = parseInt(req.params.userId, 10);
//   const page = req.query.page || 1;

//   try {
//     // Fetch user data, including selected genres and languages
//     // Note: Replace this with your actual logic to get user preferences from DB
//     const userPreferences = await getUserPreferences(userId);
//     const { genres, languages } = userPreferences;

//     // Fetch movies based on user preferences
//     const movies = await fetchMovies(genres, languages, page);

//     res.json({
//       movies,
//       total_pages: 1, // Dummy value for total pages as it’s not aggregated
//       total_results: movies.length,
//     });
//   } catch (error) {
//     console.error("Error fetching movies:", error);
//     res.status(500).json({ error: "Failed to fetch movies" });
//   }
// });

// // Mock function to get user preferences (replace with actual implementation)
// const getUserPreferences = async (userId) => {
//   // Example: replace with actual database query or data fetching logic
//   return {
//     genres: [12, 35, 99], // Example genres
//     languages: ["nl", "fr", "it"], // Example languages
//   };
// };

// import express from "express";
// const router = express.Router();
// const fetch = require("node-fetch");
// const { getMoviesByUserId } = require("./movieModels"); // Adjust path as necessary

// const TMDB_API_KEY = process.env.TMDB_API_KEY;
// const TMDB_BASE_URL = process.env.BASE_URI;
// const IMAGES_URI = process.env.IMAGES_URI;

// router.get("/movies/:userId", async (req, res) => {
//   const userId = parseInt(req.params.userId, 10);

//   try {
//     // Fetch user data including genres and languages
//     const userMovies = await getMoviesByUserId(userId);

//     // Extract genres and languages
//     const userGenres = userMovies.flatMap((movie) => movie.genres);
//     const userLanguages = userMovies.flatMap((movie) => movie.languages);

//     // Construct TMDB API URL
//     const genresParam = userGenres.join("%2C"); // URL encoding
//     const languagesParam = userLanguages.join("%2C"); // URL encoding

//     const url = `https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&page=1&sort_by=vote_average.asc&with_genres=${genresParam}&with_original_language=${languagesParam}`;
//     const options = {
//       method: "GET",
//       headers: {
//         accept: "application/json",
//         Authorization: `Bearer ${apiKey}`,
//       },
//     };

//     // Fetch data from TMDB
//     const response = await fetch(url, options);
//     if (!response.ok) {
//       throw new Error(`TMDB fetch error! status: ${response.status}`);
//     }
//     const tmdbData = await response.json();

//     // Send response to client
//     res.json(tmdbData.results);
//   } catch (error) {
//     console.error("Error fetching data:", error);
//     res.status(500).json({ error: "An error occurred while fetching data." });
//   }
// });

// export default router;
