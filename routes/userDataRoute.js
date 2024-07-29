import express from "express";

const userRoutes = express.Router();
import { getAllUsers, createUser } from "../models/userModels.js";

userRoutes.get("/", async function (req, res) {
  const allUsers = await getAllUsers();
  console.log(allUsers);
  res.status(200).json({ payload: allUsers });
  console.log(req.body, "route function called");
});

userRoutes.post("/", async function (req, res) {
  console.log(req.body, "route function called");
  const newUser = req.body;
  const result = await createUser(newUser);
  res.status(200).json(result);
});

export default userRoutes;
