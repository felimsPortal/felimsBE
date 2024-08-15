import express from "express";
import path from "path";
import fs from "fs";

const router = express.Router();
const jsonFilePath = path.join(process.cwd(), "movies.json");

router.get("/", (req, res) => {
  fs.readFile(jsonFilePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
    res.json(JSON.parse(data));
  });
});

export default router;
