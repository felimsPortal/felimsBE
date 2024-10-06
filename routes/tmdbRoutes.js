import express from "express";
import axios from "axios";
import {
  fetchYoutubeTrailerForTvShow,
  fetchFilteredSearch,
} from "../services/tmdbServices.js";

const router = express.Router();
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const IMAGES_URI = "https://image.tmdb.org/t/p/w500";

// Route to play the movie by movie name
router.get("/play/:movieName", (req, res) => {
  const { movieName } = req.params;
  const movieDirectory = "D:/Radarr-Movies"; // Path to your movie directory

  console.log(`Incoming request to play movie: ${movieName}`);

  // Read the contents of the movie directory
  fs.readdir(movieDirectory, (err, files) => {
    if (err) {
      console.error("Error reading the movie directory:", err);
      return res.status(500).json({ error: "Unable to read movie directory" });
    }

    console.log("Files found in movie directory:", files);

    // Try to find a file that starts with the movie name (ignoring extension)
    const movieFile = files.find((file) =>
      file.toLowerCase().startsWith(movieName.toLowerCase())
    );

    if (!movieFile) {
      console.error(`Movie file not found for: ${movieName}`);
      return res.status(404).json({ error: "Movie not found" });
    }

    console.log(`Movie file found: ${movieFile}`);

    // Construct the full path to the movie file
    const movieFilePath = path.join(movieDirectory, movieFile);

    // Log the full path of the movie file
    console.log(`Serving movie file: ${movieFilePath}`);

    // Send the movie file
    res.sendFile(movieFilePath);
  });
});
// Route to play the movie by movie name
// router.get("/play/:movieName", (req, res) => {
//   const { movieName } = req.params;
//   const movieDirectory = "D:/Radarr-Movies"; // Path to your movie directory

//   // Construct the full path to the movie file
//   const movieFilePath = path.join(movieDirectory, `${movieName}.mkv`); // Assuming the movie is in MKV format

//   // Check if the movie file exists
//   if (fs.existsSync(movieFilePath)) {
//     // Send the movie file
//     res.sendFile(movieFilePath);
//   } else {
//     // If movie is not found, send a 404 error
//     res.status(404).json({ error: "Movie not found" });
//   }
// });

router.get("/movies/:tmdbId", async (req, res) => {
  const { tmdbId } = req.params;

  try {
    // Make a request to TMDB to fetch movie details
    const response = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
      params: {
        api_key: TMDB_API_KEY,
      },
    });

    // Send the relevant movie details back to the frontend
    res.status(200).json(response.data);
  } catch (error) {
    console.error(`Error fetching TMDB movie details for ID ${tmdbId}:`, error);
    res.status(404).json({ error: "Movie not found" });
  }
});

router.get("/filtered", async (req, res) => {
  const { imdbMin, imdbMax, yearMin, yearMax, language, genre, page } =
    req.query;

  // Log the incoming query parameters for debugging
  console.log("Incoming query parameters:", req.query);

  // Prepare filter data
  const filters = {
    imdbScore: {
      min: parseFloat(imdbMin),
      max: parseFloat(imdbMax),
    },
    releaseYear: {
      min: parseInt(yearMin),
      max: parseInt(yearMax),
    },
    language,
    genre,
    page: parseInt(page) || 1, // Default to page 1 if not provided
  };

  try {
    // Call the fetchFilteredSearch function and get results
    const results = await fetchFilteredSearch(filters);

    // Return the filtered search results as JSON
    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching filtered search results:", error);
    res.status(500).json({ error: "Failed to fetch filtered search results." });
  }
});

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
