import { query } from "../db/index.js";

export async function createUserMovieList(movieData) {
  try {
    const result = await query(
      "INSERT INTO movies (user_id, languages, genres) VALUES ($1, $2, $3) RETURNING *",
      [movieData.user_id, movieData.languages, movieData.genres]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error executing query:", error);
    throw error;
  }
}
