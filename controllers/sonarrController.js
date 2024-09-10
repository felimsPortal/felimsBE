import axios from "axios";

export const fetchTvShowByTmdbId = async (tmdbId) => {
  try {
    const sonarrUrl = `${process.env.SONARR_BASE_URL}/series/lookup?term=tmdb:${tmdbId}`;
    const response = await axios.get(sonarrUrl, {
      headers: {
        "X-Api-Key": process.env.SONARR_API_KEY,
      },
    });

    console.log("Sonarr API response:", response.data);

    if (Array.isArray(response.data) && response.data.length > 0) {
      const tvShow = response.data[0]; // Get the first show

      // Format the TV show data
      const formattedTvShow = {
        title: tvShow.title,
        originalLanguage: tvShow.originalLanguage || "N/A",
        overview: tvShow.overview || "No overview available",
        year: tvShow.year || "N/A",
        youtubeTrailerId: tvShow.youTubeTrailerId || "N/A",
        genres: tvShow.genres || [],
        imdbRating: tvShow.ratings?.imdb?.value || "N/A",
      };

      return formattedTvShow;
    } else {
      throw new Error("No TV show data found or invalid response format");
    }
  } catch (error) {
    console.error("Error fetching TV show by TMDB ID:", error.message);
    throw new Error("Could not fetch TV show data");
  }
};

const getTvdbIdFromTmdb = async (showId) => {
  const tmdbUrl = `https://api.themoviedb.org/3/tv/${showId}/external_ids?api_key=${process.env.TMDB_API_KEY}`;

  const response = await axios.get(tmdbUrl);

  if (response.data && response.data.tvdb_id) {
    return response.data.tvdb_id;
  }

  throw new Error("TVDB ID not found for this TMDB ID");
};

// Function to request episode download from Sonarr using TVDB ID, season, and episode numbers
const downloadEpisodeFromSonarr = async (
  tvdbId,
  seasonNumber,
  episodeNumber
) => {
  const sonarrUrl = `${process.env.SONARR_BASE_URL}/command`;

  const downloadRequest = {
    name: "EpisodeSearch",
    seriesId: tvdbId, // Sonarr uses this to recognize the show
    seasonNumber: seasonNumber,
    episodeNumbers: [episodeNumber], // Array of episode numbers
  };

  const response = await axios.post(sonarrUrl, downloadRequest, {
    headers: {
      "X-Api-Key": process.env.SONARR_API_KEY,
    },
  });

  return response.data;
};

// Express route to handle the API request from the front-end
export const downloadEpisode = async (req, res) => {
  const { showId, seasonNumber, episodeNumber } = req.body;

  try {
    // Get TVDB ID from TMDB
    const tvdbId = await getTvdbIdFromTmdb(showId);

    // Use Sonarr API to download episode
    const downloadResponse = await downloadEpisodeFromSonarr(
      tvdbId,
      seasonNumber,
      episodeNumber
    );

    res.status(200).json({ success: true, data: downloadResponse });
  } catch (error) {
    console.error("Error downloading episode:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
