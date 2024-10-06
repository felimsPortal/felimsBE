import axios from "axios";

export const fetchMovieByTmdbId = async (tmdbId) => {
  try {
    const radarrUrl = `${process.env.RADARR_BASE_URL}/movie/lookup?term=tmdb:${tmdbId}`;
    const response = await axios.get(radarrUrl, {
      headers: {
        "X-Api-Key": process.env.RADARR_API_KEY,
      },
    });

    console.log("Radarr API response:", response.data);

    // Check if response.data is an array and has the expected structure
    if (Array.isArray(response.data) && response.data.length > 0) {
      const movie = response.data[0]; // Get the first movie

      // Format the movie data to only include the required fields
      const formattedMovie = {
        title: movie.title,
        remotePoster: movie.remotePoster,
        originalLanguage: movie.originalLanguage?.name || "N/A",
        overview: movie.overview || "No overview available",
        year: movie.year || "N/A",
        youtubeTrailerId: movie.youTubeTrailerId || "N/A",
        genres: movie.genres || [],
        imdbRating: movie.ratings?.imdb?.value || "TBD",
        tmdbRating: movie.ratings?.tmdb?.value || "TBD",
        runtime: movie.runtime || "N/A",
        genre: movie.genres || "N/A",
        certification: movie.certification || "N/A",
        // Conditionally include minimumAvailability if it's "released"
        ...(movie.minimumAvailability === "released" && {
          minimumAvailability: movie.minimumAvailability,
        }),
      };

      console.log("Formatted movie details:", formattedMovie);

      return formattedMovie;
    } else {
      throw new Error("No movie data found or invalid response format");
    }
  } catch (error) {
    console.error("Error fetching movie by TMDB ID:", error.message);
    throw new Error("Could not fetch movie data");
  }
};

export const addMovieToDownload = async (req, res) => {
  const { tmdbId } = req.body; // Expecting tmdbId to be passed in the request body

  if (!tmdbId) {
    return res.status(400).json({ error: "tmdbId is required" });
  }

  try {
    const radarrUrl = `${process.env.RADARR_BASE_URL}/movie`;
    const response = await axios.post(
      radarrUrl,
      {
        tmdbId: tmdbId,
        qualityProfileId: 1, // Adjust based on your setup
        monitored: true,
        rootFolderPath: "/path/to/your/movies/folder", // Adjust this to your Radarr setup
        minimumAvailability: "announced", // or "released" based on your preference
        addOptions: {
          searchForMovie: true,
        },
      },
      {
        headers: {
          "X-Api-Key": process.env.RADARR_API_KEY,
        },
      }
    );

    if (response.status === 201) {
      res.status(201).json({ message: "Movie added to download queue" });
    } else {
      res
        .status(response.status)
        .json({ error: "Failed to add movie to download queue" });
    }
  } catch (error) {
    console.error("Error adding movie to download queue:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
