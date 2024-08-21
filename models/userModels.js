import { query } from "../db/index.js";

export async function getAllUsers() {
  const result = await query("SELECT * FROM users");
  const allUsers = result.rows;
  return allUsers;
}

export async function createUser(userList) {
  const result = await query(
    "INSERT INTO users (display_name, email, password) VALUES ($1, $2, $3) RETURNING *",
    [userList.display_name, userList.email, userList.password]
  );
  return result.rows;
}

export async function getUserById(userId) {
  try {
    const userResult = await query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);
    const user = userResult.rows[0];

    if (!user) {
      return null;
    }

    const movieResult = await query(
      "SELECT languages, genres FROM movies WHERE user_id = $1",
      [userId]
    );

    const moviePreferences = movieResult.rows[0];

    if (moviePreferences) {
      user.languages = Array.isArray(moviePreferences.languages)
        ? moviePreferences.languages
        : [];
      user.genres = Array.isArray(moviePreferences.genres)
        ? moviePreferences.genres
        : [];
    } else {
      user.languages = [];
      user.genres = [];
    }

    return user;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
}
