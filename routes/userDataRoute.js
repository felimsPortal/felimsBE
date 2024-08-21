import express from "express";
import { getAllUsers, createUser, getUserById } from "../models/userModels.js";
import { createUserMovieList } from "../models/movieModels.js";

const userRoutes = express.Router();

userRoutes.post("/:id/movies", async function (req, res) {
  const userId = req.params.id;
  const { movies } = req.body;
  try {
    await createUserMovieList(userId, movies);
    res.status(200).json({ message: "Movies saved successfully" });
  } catch (error) {
    console.error("Error saving movies:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

userRoutes.post("/", async function (req, res) {
  console.log(req.body, "route function called");
  const newUser = req.body;
  const result = await createUser(newUser);
  res.status(200).json(result);
});

userRoutes.get("/", async function (req, res) {
  const allUsers = await getAllUsers();
  console.log(allUsers);
  res.status(200).json({ payload: allUsers });
  console.log(req.body, "route function called");
});

userRoutes.get("/:id", async function (req, res) {
  console.log("Received request for ID:", req.params.id);
  try {
    const userId = req.params.id;
    const user = await getUserById(userId);
    console.log("User fetched:", user);
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default userRoutes;
