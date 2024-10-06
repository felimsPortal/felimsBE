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

// Route to check if the movie exists in Radarr
router.get("/check/:tmdbId", async (req, res) => {
  const { tmdbId } = req.params;

  try {
    // Make a request to Radarr to check if the movie exists
    const radarrUrl = `${process.env.RADARR_BASE_URL}/movie?tmdbId=${tmdbId}&apikey=${process.env.RADARR_API_KEY}`;
    const response = await axios.get(radarrUrl);

    if (response.data.length > 0) {
      // Movie exists in the Radarr database
      return res.json({ exists: true, movie: response.data[0] });
    } else {
      // Movie does not exist
      return res.json({ exists: false });
    }
  } catch (error) {
    console.error("Error checking movie in Radarr:", error);
    return res.status(500).json({ error: "Internal server error" });
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

// export const addMovieToDownload = async (req, res) => {
//   const { tmdbId } = req.body; // Expecting tmdbId to be passed in the request body

//   if (!tmdbId) {
//     return res.status(400).json({ error: "tmdbId is required" });
//   }

//   try {
//     const radarrUrl = `${process.env.RADARR_BASE_URL}/movie`;
//     const response = await axios.post(
//       radarrUrl,
//       {
//         tmdbId: tmdbId,
//         qualityProfileId: 1, // Adjust based on your setup
//         monitored: true,
//         rootFolderPath: "/path/to/your/movies/folder", // Adjust this to your Radarr setup
//         minimumAvailability: "announced", // or "released" based on your preference
//         addOptions: {
//           searchForMovie: true,
//         },
//       },
//       {
//         headers: {
//           "X-Api-Key": process.env.RADARR_API_KEY,
//         },
//       }
//     );

//     if (response.status === 201) {
//       res.status(201).json({ message: "Movie added to download queue" });
//     } else {
//       res
//         .status(response.status)
//         .json({ error: "Failed to add movie to download queue" });
//     }
//   } catch (error) {
//     console.error("Error adding movie to download queue:", error.message);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

export default router;
