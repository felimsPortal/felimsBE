import express from "express";
import {
  getAllUsers,
  createUser,
  getUserByFirebaseUid,
} from "../models/userModels.js";
import { createUserMovieList } from "../models/movieModels.js";

const userRoutes = express.Router();

// Route to handle creating a user movie list for a specific user
userRoutes.post("/:firebaseUid/movies", async function (req, res) {
  console.log(
    "Received request body at endpoint /firebaseUid endpoint:",
    req.body
  );
  const firebaseUid = req.params.firebaseUid;
  const { movies } = req.body;

  try {
    await createUserMovieList(firebaseUid, movies);
    res.status(200).json({ message: "Movies saved successfully" });
  } catch (error) {
    console.error("Error saving movies:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to handle user creation
userRoutes.post("/", async function (req, res) {
  console.log("Received request body at endpoint /:", req.body);

  if (!req.body.firebase_uid) {
    console.error("firebase_uid is missing in the request body");
    return res.status(400).json({ error: "firebase_uid is required" });
  }

  const newUser = req.body;
  const result = await createUser(newUser);
  res.status(200).json(result);
});

// Route to fetch all users
userRoutes.get("/", async function (req, res) {
  const allUsers = await getAllUsers();
  console.log(allUsers);
  res.status(200).json({ payload: allUsers });
});

// Route to fetch a user by firebaseUid
userRoutes.get("/:firebaseUid", async function (req, res) {
  const firebaseUid = req.params.firebaseUid;
  console.log("Received request for Firebase UID:", req.params.firebaseUid);
  try {
    const user = await getUserByFirebaseUid(firebaseUid); // Use the firebaseUid here
    console.log("User fetched:", user);
    if (user) {
      res.status(200).json(user);
    } else {
      console.error("User not found in the database for UID:", firebaseUid);
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default userRoutes;
