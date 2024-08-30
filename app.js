import express from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";

import userRoutes from "./routes/userDataRoute.js";
import movieRoutes from "./routes/movieDataRoutes.js";
import tmdbRoutes from "./routes/tmdbRoutes.js";
import radarrRoutes from "./routes/radarrDataRoutes.js";

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
app.use("/api/tmdb", tmdbRoutes);
app.use("/api/radar", radarrRoutes);

export default app;
