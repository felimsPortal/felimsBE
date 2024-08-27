import { query } from "../db/index.js";

export async function getAllUsers() {
  const result = await query("SELECT * FROM users");
  const allUsers = result.rows;
  return allUsers;
}

export async function createUser(userList) {
  const result = await query(
    "INSERT INTO users (display_name, email, password, firebase_uid) VALUES ($1, $2, $3, $4) RETURNING *",
    [
      userList.display_name,
      userList.email,
      userList.password,
      userList.firebase_uid,
    ]
  );
  return result.rows;
}

export async function getUserByFirebaseUid(firebaseUid) {
  try {
    const userQuery = "SELECT * FROM users WHERE firebase_uid = $1";
    const userResult = await query(userQuery, [firebaseUid]);

    if (userResult.rows.length === 0) {
      return null;
    }

    const user = userResult.rows[0];
    const userId = user.id;

    const movieQuery =
      "SELECT languages, genres FROM movies WHERE user_id = $1";
    const movieResult = await query(movieQuery, [userId]);

    if (movieResult.rows.length > 0) {
      user.moviePreferences = movieResult.rows[0];
    } else {
      user.moviePreferences = { languages: [], genres: [] };
    }

    return user;
  } catch (error) {
    console.error(`Error fetching user by firebase_uid: ${firebaseUid}`, error);
    throw error;
  }
}
