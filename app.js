import express from "express";
import morgan from "morgan";
import cors from "cors";
import userRoutes from "./routes/userDataRoute.js";
import movieRoutes from "./routes/movieRoutes.js";
import path from "path";

const app = express();
const externalDrivePath = "\\\\Ash\\d\\FELIMS";

app.use(morgan("dev"));
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
  })
);
app.use("/public", express.static(path.join(externalDrivePath)));

app.use("/api/userdata", userRoutes);
app.use("/api/movies", movieRoutes);

export default app;
