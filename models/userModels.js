import { query } from "../db/index.js";

export async function getAllUsers() {
  const result = await query("SELECT * FROM user_data");
  const allUsers = result.rows;
  return allUsers;
}

export async function createUser(userList) {
  const result = await query(
    "INSERT INTO user_data (display_name, email, password) VALUES ($1, $2, $3) RETURNING *",
    [userList.display_name, userList.email, userList.password]
  );
  return result.rows;
}
