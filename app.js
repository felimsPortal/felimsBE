import express from "express";
import morgan from "morgan";
import cors from "cors";
import userRoutes from "./routes/userDataRoute.js";
import movieRoutes from "./routes/movieDataRoutes.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(morgan("dev"));
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

app.use("/api/userdata", userRoutes);
app.use("/api/movies", movieRoutes);

export default app;
