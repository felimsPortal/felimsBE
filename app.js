import express from "express";
import morgan from "morgan";
import cors from "cors";
import userRoutes from "./routes/userDataRoute.js";

const app = express();

app.use(morgan("dev"));
// app.use(express.static("public"));
app.use(express.json());
app.use(cors("*"));

app.use("/api/userdata", userRoutes);

export default app;
