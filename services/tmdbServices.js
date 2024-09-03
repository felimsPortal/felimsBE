import axios from "axios";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = process.env.BASE_URI;
const IMAGES_URI = process.env.IMAGES_URI;
const MIN_VOTE_COUNT = 10;

export const fetchTvShowsWithSeasons = async (tvShowId) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/tv/${tvShowId}`, {
      params: {
        api_key: TMDB_API_KEY,
        append_to_response: "seasons",
      },
    });

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
