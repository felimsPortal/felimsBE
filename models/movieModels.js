import { query } from "../db/index.js";

export async function createUserMovieList(firebaseUid, movieData) {
  try {
    const result = await query(
      "INSERT INTO movies (display_name, firebase_uid, languages, genres) VALUES ($1, $2, $3, $4) RETURNING *",
      [
        movieData.display_name,
        firebaseUid,
        movieData.languages,
        movieData.genres,
      ]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error executing query:", error);
    throw error;
  }
}
