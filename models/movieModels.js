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

// export const getMoviesByUserId = async (userId) => {
//   try {
//     const result = await query("SELECT * FROM movies WHERE user_id = $1", [
//       userId,
//     ]);
//     if (result.rows.length === 0) {
//       throw new Error("No movies found for this user");
//     }
//     return result.rows[0]; // Assuming you want to return the first row
//   } catch (error) {
//     console.error("Error in getMoviesByUserId:", error);
//     throw error;
//   }
// };
// export async function getMoviesByUserId(userId) {
//   try {
//     const result = await query(
//       `
//       SELECT u.id, u.display_name, u.email, m.languages, m.genres
//       FROM users u
//       JOIN movies m ON u.id = m.user_id
//       WHERE u.id = $1
//         AND array_length(m.languages, 1) > 0
//         AND array_length(m.genres, 1) > 0;
//     `,
//       [userId]
//     );

//     return result.rows; // Returns an array of user and movie details
//   } catch (error) {
//     console.error("Error fetching movies:", error);
//     throw error;
//   }
// }
