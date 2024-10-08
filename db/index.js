import pkg from "pg";
import * as dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.POSTGRES_CONNECTION_URL,
});

export function query(text, params) {
  return pool.query(text, params);
}
