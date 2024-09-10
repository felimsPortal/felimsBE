import express from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";

import userRoutes from "./routes/userDataRoute.js";
import movieRoutes from "./routes/movieDataRoutes.js";
import tmdbRoutes from "./routes/tmdbRoutes.js";
import radarrRoutes from "./routes/radarrDataRoutes.js";
import sonarrRoutes from "./routes/sonarrDataRoutes.js";
import tvShowsRoutes from "./routes/tvShowsDataRoutes.js";

dotenv.config();

const app = express();
app.use(morgan("dev"));
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
  })
);
console.log("Registering routes...");
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

app.use("/api/userdata", userRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/tmdb", tmdbRoutes);
app.use("/api/radar", radarrRoutes);
app.use("/api/sonar", sonarrRoutes);
console.log("Registered route: /api/sonar");
// app.use("/api/tvshows", tvShowsRoutes);
app.use(
  "/api/tvshows",
  (req, res, next) => {
    console.log("Matched /api/tvshows route");
    next();
  },
  tvShowsRoutes
);

app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

export default app;
