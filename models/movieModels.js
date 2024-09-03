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
export async function getUserMoviePreferences(firebaseUid) {
  try {
    const result = await query(
      "SELECT languages FROM movies WHERE firebase_uid = $1 LIMIT 1",
      [firebaseUid]
    );

    if (result.rows.length === 0) {
      return null; // No preferences found for this user
    }

    return {
      languages: result.rows[0].languages,
    };
  } catch (error) {
    console.error("Error fetching user movie preferences:", error);
    throw error;
  }
}
