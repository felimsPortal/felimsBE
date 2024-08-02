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
  const result = await query("SELECT * FROM users WHERE id = $1", [userId]);
  const user = result.rows[0]; // Renamed the variable to `user`
  return user;
}
