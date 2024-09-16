import axios from "axios";
import { searchMovieByExactTitle } from "../controllers/nzbGeekController.js";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = process.env.BASE_URI;
const IMAGES_URI = process.env.IMAGES_URI;
const MIN_VOTE_COUNT = 10;

export const fetchFilteredSearch = async ({
  imdbScore,
  releaseYear,
  language,
  genre,
  page = 1,
}) => {
  const url = `${TMDB_BASE_URL}/discover/movie`;

  try {
    // Build the query parameters based on the filters
    const params = {
      api_key: TMDB_API_KEY,
      page,
      include_adult: false,
      "vote_average.gte": imdbScore?.min || 0,
      "vote_average.lte": imdbScore?.max || 10,
      "vote_count.gte": MIN_VOTE_COUNT,
      "primary_release_date.gte": `${releaseYear?.min || 1900}-01-01`,
      "primary_release_date.lte": `${
        releaseYear?.max || new Date().getFullYear()
      }-12-31`,
      with_original_language: language ? language.slice(0, 2) : undefined,
      with_genres: genre ? genre : undefined,
    };

    console.log("TMDb discover API request params:", params);

    const response = await axios.get(url, { params });
    console.log(`Fetched ${response.data.results.length} movies from TMDB`);

    // New Code: Check availability in nzbGeek
    const movies = await Promise.all(
      response.data.results.map(async (movie) => {
        console.log(`Checking movie: ${movie.title} (TMDB ID: ${movie.id})`);

        // Correctly pass the movie title instead of the whole object
        const isAvailableInNzbGeek = await searchMovieByExactTitle(movie.title);

        if (isAvailableInNzbGeek) {
          console.log(
            `Movie ${movie.title} is available in nzbGeek. Including in results.`
          );
          return {
            id: movie.id,
            title: movie.title,
            release_date: movie.release_date,
            poster_path: `${IMAGES_URI}${movie.poster_path}`,
            backdrop_path: `https://image.tmdb.org/t/p/original/${movie.backdrop_path}`,
            vote_average: movie.vote_average,
            runtime: movie.runtime,
          };
        }

        console.log(
          `Movie ${movie.title} is NOT available in nzbGeek. Excluding from results.`
        );
        return null; // Exclude if not available
      })
    );

    // Filter out any null results (movies not available in nzbGeek)
    const filteredMovies = movies.filter((movie) => movie !== null);

    return {
      movies: filteredMovies,
      total_pages: response.data.total_pages,
      total_results: filteredMovies.length,
    };
  } catch (error) {
    console.error("Error fetching filtered search results from TMDb:", error);
    return { movies: [], total_pages: 0, total_results: 0 };
  }
};

// export const fetchFilteredSearch = async ({
//   imdbScore,
//   releaseYear,
//   language,
//   genre,
//   page = 1,
// }) => {
//   const url = `${TMDB_BASE_URL}/discover/movie`;

//   try {
//     // Build the query parameters based on the filters
//     const params = {
//       api_key: TMDB_API_KEY,
//       page,
//       include_adult: false, // Exclude adult content
//       "vote_average.gte": imdbScore?.min || 0,
//       "vote_average.lte": imdbScore?.max || 10,
//       "vote_count.gte": MIN_VOTE_COUNT,
//       "primary_release_date.gte": `${releaseYear?.min || 1900}-01-01`,
//       "primary_release_date.lte": `${
//         releaseYear?.max || new Date().getFullYear()
//       }-12-31`,
//       with_original_language: language ? language.slice(0, 2) : undefined,
//       with_genres: genre ? genre : undefined, // No need to map the genre if it's already an ID
//     };

//     console.log("TMDb discover API request params:", params);

//     const response = await axios.get(url, { params });

//     console.log(`Fetched ${response.data.results.length} movies from TMDB`);

//     // Map over the TMDB response and check each movie against nzbGeek
//     const movies = await Promise.all(
//       response.data.results.map(async (movie) => {
//         console.log(`Checking movie: ${movie.title} (TMDB ID: ${movie.id})`);

//         const isAvailableInNzbGeek = await checkMovieAvailabilityInNzbGeek(movie.title);

//         if (isAvailableInNzbGeek) {
//           console.log(`Movie ${movie.title} is available in nzbGeek. Including in results.`);
//           return {
//             id: movie.id,
//             title: movie.title,
//             release_date: movie.release_date,
//             poster_path: `${IMAGES_URI}${movie.poster_path}`,
//             backdrop_path: `https://image.tmdb.org/t/p/original/${movie.backdrop_path}`,
//             vote_average: movie.vote_average,
//             runtime: movie.runtime,
//           };
//         }

//         console.log(`Movie ${movie.title} is NOT available in nzbGeek. Excluding from results.`);
//         return null; // Return null if not available in nzbGeek
//       })
//     );

//     // Filter out null values (movies not available in nzbGeek)
//     const availableMovies = movies.filter((movie) => movie !== null);

//     console.log(`Filtered ${availableMovies.length} movies available in nzbGeek`);

//     return {
//       movies: availableMovies,
//       total_pages: response.data.total_pages,
//       total_results: availableMovies.length,
//     };
//   } catch (error) {
//     console.error("Error fetching filtered search results from TMDb:", error);
//     return { movies: [], total_pages: 0, total_results: 0 };
//   }
// };

export const fetchTvShowsWithSeasons = async (tvShowId, page) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/tv/${tvShowId}`, {
      params: {
        api_key: TMDB_API_KEY,
        append_to_response: "seasons",
        sort_by: "primary_release_date.desc", // Sort by latest release date
        page: page, // Pagination

        include_adult: false,
      },
    });

    // Log the full response
    console.log("Full API response:", response);

    // Log just the TV show data (this is typically what you need)
    console.log("TV Show Data:", response.data);

    const tvShowData = response.data;
    if (tvShowData.vote_average < 3) {
      console.log(
        `TV Show with ID ${tvShowId} has a vote_average of ${tvShowData.vote_average} and will be excluded.`
      );
      return null;
    }

    const filteredSeasons = (tvShowData.seasons || []).filter(
      (season) => season.poster_path !== null
    );

    if (filteredSeasons.length === 0) {
      console.log(
        `TV Show with ID ${tvShowId} has no seasons with a valid poster_path and will be excluded.`
      );
      return null;
    }

    return {
      ...tvShowData,
      seasons: filteredSeasons.map((season) => ({
        id: season.id,
        name: season.name,
        poster_path: `${IMAGES_URI}${season.poster_path}`,
        season_number: season.season_number,
        overview: season.overview,
        air_date: season.air_date,
      })),
    };
  } catch (error) {
    console.error("Error fetching TV show seasons:", error);
    return null;
  }
};

// Fetch episodes for a specific season of a TV show
export const fetchEpisodesBySeason = async (tvShowId, seasonNumber) => {
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/tv/${tvShowId}/season/${seasonNumber}`,
      {
        params: {
          api_key: TMDB_API_KEY,
        },
      }
    );

    // Return the season details, which includes the episodes
    return response.data;
  } catch (error) {
    console.error("Error fetching episodes for season:", error);
    return null;
  }
};

export const discoverMedia = async (type, query, page = 1) => {
  let url;
  if (type === "tv") {
    url = `${TMDB_BASE_URL}/search/tv`;
  } else if (type === "movie") {
    url = `${TMDB_BASE_URL}/search/movie`;
  } else {
    throw new Error("Invalid type parameter. Must be 'movie' or 'tv'.");
  }

  let allResults = [];
  let currentPage = page;
  let totalPages = 1;

  try {
    do {
      const response = await axios.get(url, {
        params: {
          api_key: TMDB_API_KEY,
          query,
          include_adult: false,
          page: currentPage,
        },
      });

      const media = (response.data.results || []).filter(
        (item) => item.poster_path !== null && item.vote_average >= 3
      );

      totalPages = response.data.total_pages;
      currentPage += 1;

      if (type === "tv") {
        for (const tvShow of media) {
          const tvShowWithSeasons = await fetchTvShowsWithSeasons(tvShow.id);
          if (tvShowWithSeasons) {
            allResults.push({
              id: tvShowWithSeasons.id,
              title: tvShowWithSeasons.name,
              overview: tvShowWithSeasons.overview,
              release_date: tvShowWithSeasons.first_air_date,
              vote_average: tvShowWithSeasons.vote_average,
              original_language: tvShowWithSeasons.original_language,
              genre_ids: tvShowWithSeasons.genres.map((genre) => genre.id),
              poster_path: `${IMAGES_URI}${tvShowWithSeasons.poster_path}`,
              backdrop_path: `https://image.tmdb.org/t/p/original/${tvShowWithSeasons.backdrop_path}`,
              media_type: type,
              seasons: tvShowWithSeasons.seasons,
            });
          }
        }
      } else {
        allResults = [
          ...allResults,
          ...media.map((movie) => ({
            id: movie.id,
            title: movie.title,
            overview: movie.overview,
            release_date: movie.release_date,
            vote_average: movie.vote_average,
            original_language: movie.original_language,
            genre_ids: movie.genre_ids,
            poster_path: `${IMAGES_URI}${movie.poster_path}`,
            backdrop_path: `https://image.tmdb.org/t/p/original/${movie.backdrop_path}`,
            media_type: type,
          })),
        ];
      }
    } while (currentPage <= totalPages && currentPage <= 50);

    return {
      results: allResults,
      total_pages: totalPages,
      total_results: allResults.length,
    };
  } catch (error) {
    console.error(
      `Error discovering ${type}:`,
      error.response?.data || error.message
    );
    return {
      results: [],
      total_pages: 0,
      total_results: 0,
    };
  }
};

export const fetchMoviesByLanguageAndGenre = async (
  language,
  genres,
  page = 1
) => {
  const url = `${TMDB_BASE_URL}/discover/movie`;

  try {
    const response = await axios.get(url, {
      params: {
        api_key: TMDB_API_KEY,
        sort_by: "primary_release_date.desc",
        with_original_language: language,
        page: page,
        "vote_count.gte": MIN_VOTE_COUNT,
        with_genres: genres.join("|"),
      },
    });
    const movies = response.data.results
      .filter((movie) => movie.poster_path !== null && movie.vote_average >= 3)
      .map((movie) => ({
        id: movie.id,
        title: movie.title,
        overview: movie.overview,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        original_language: movie.original_language,
        genre_ids: movie.genre_ids,
        poster_path: `${IMAGES_URI}${movie.poster_path}`,
        backdrop_path: `https://image.tmdb.org/t/p/original/${movie.backdrop_path}`,
      }));

    return {
      movies: movies, // Ensure that movies is returned here
      total_pages: response.data.total_pages,
      total_results: response.data.total_results,
    };
  } catch (error) {
    console.error(`Error fetching movies for language ${language}:`, error);
    return {
      movies: [],
      total_pages: 0,
      total_results: 0,
    };
  }
};

export const fetchMoviesByLanguage = async (language, page = 1) => {
  const url = `${TMDB_BASE_URL}/discover/movie`;

  try {
    const response = await axios.get(url, {
      params: {
        api_key: TMDB_API_KEY,
        sort_by: "primary_release_date.desc",
        with_original_language: language,
        page: page,
        "vote_count.gte": 50, // adjust this threshold as necessary
      },
    });
    console.log("response", response);

    const movies = response.data.results
      .filter((movie) => movie.poster_path !== null)
      .map((movie) => ({
        id: movie.id,
        poster_path: `${IMAGES_URI}${movie.poster_path}`,
        backdrop_path: `https://image.tmdb.org/t/p/original/${movie.backdrop_path}`,
        original_language: movie.original_language,
      }));

    return {
      movies: movies,
      total_pages: response.data.total_pages,
      total_results: response.data.total_results,
    };
  } catch (error) {
    console.error(`Error fetching movies for language ${language}:`, error);
    return {
      movies: [],
      total_pages: 0,
      total_results: 0,
    };
  }
};

export const fetchLatestMovies = async (page = 1) => {
  const url = `${TMDB_BASE_URL}/discover/movie`;
  try {
    const response = await axios.get(url, {
      params: {
        api_key: TMDB_API_KEY,
        sort_by: "primary_release_date.desc", // Sort by latest release date
        page: page, // Pagination
        "vote_count.gte": 5,
        include_adult: false,
      },
    });

    const movies = response.data.results.map((movie) => ({
      id: movie.id,
      title: movie.title,
      release_date: movie.release_date,
      poster_path: `${IMAGES_URI}${movie.poster_path}`,
      backdrop_path: `https://image.tmdb.org/t/p/original/${movie.backdrop_path}`,
      vote_average: movie.vote_average,
      runtime: movie.runtime,
    }));

    return {
      movies,
      total_pages: response.data.total_pages,
      total_results: response.data.total_results,
    };
  } catch (error) {
    console.error("Error fetching latest movies:", error);
    return { movies: [], total_pages: 0, total_results: 0 };
  }
};

export const fetchLatestTVShows = async (page = 1) => {
  const url = `${TMDB_BASE_URL}/discover/tv`; // Use /discover/tv for TV shows
  try {
    const response = await axios.get(url, {
      params: {
        api_key: TMDB_API_KEY,
        sort_by: "first_air_date.desc", // Sort by latest release date
        page: page,
        "vote_count.gte": 5,
        include_adult: false,
      },
    });

    const tvShows = response.data.results.map((tvShow) => ({
      id: tvShow.id,
      title: tvShow.name, // TV shows use "name" instead of "title"
      first_air_date: tvShow.first_air_date, // Use first_air_date for TV shows
      poster_path: tvShow.poster_path
        ? `${IMAGES_URI}${tvShow.poster_path}`
        : null,
      backdrop_path: tvShow.backdrop_path
        ? `https://image.tmdb.org/t/p/original/${tvShow.backdrop_path}`
        : null,
      original_language: tvShow.original_language, // Language of the show
      vote_average: tvShow.vote_average, // Rating
      overview: tvShow.overview, // Overview of the show
      genres: tvShow.genre_ids, // Genre IDs (you might need to map these to genre names)
    }));

    return {
      tvShows,
      total_pages: response.data.total_pages,
      total_results: response.data.total_results,
    };
  } catch (error) {
    console.error("Error fetching latest TV shows:", error);
    return { tvShows: [], total_pages: 0, total_results: 0 };
  }
};

export const fetchYoutubeTrailerForTvShow = async (tvShowId) => {
  const url = `${TMDB_BASE_URL}/tv/${tvShowId}/videos`;

  try {
    const response = await axios.get(url, {
      params: {
        api_key: TMDB_API_KEY, // Use the API key from the environment variables
      },
    });

    // Check if the response contains valid video results
    if (
      response.data &&
      response.data.results &&
      response.data.results.length > 0
    ) {
      // Filter for YouTube trailers
      const trailer = response.data.results.find(
        (video) => video.site === "YouTube" && video.type === "Trailer"
      );

      if (trailer) {
        return trailer.key; // Return the YouTube trailer ID (key)
      } else {
        throw new Error("No YouTube trailer found");
      }
    } else {
      throw new Error("No videos found for the TV show");
    }
  } catch (error) {
    console.error(
      `Error fetching YouTube trailer for TV show ${tvShowId}:`,
      error.message
    );
    throw error; // Re-throw the error to be caught in the route handler
  }
};
