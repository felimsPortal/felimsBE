import express from "express";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
// import ffmpeg from "fluent-ffmpeg";

const router = express.Router();

// API route to list all files in the movie directory
router.get("/list-files", (req, res) => {
  const movieDirectory = "D:/Radarr-Movies"; // Adjust the directory path if needed

  try {
    const files = listFilesRecursively(movieDirectory); // Ensure listFilesRecursively function is defined
    res.json({ files });
  } catch (err) {
    console.error("Error reading directory:", err);
    return res.status(500).json({ error: "Unable to read movie directory" });
  }
});

router.get("/play/:movieName", (req, res) => {
  const encodedMovieName = req.params.movieName;
  const decodedMovieName = decodeURIComponent(encodedMovieName); // Decode the encoded URL

  // Base directory where the movies are stored
  const movieDirectory = "D:/Radarr-Movies";

  // Recursively find the movie in the directory
  const files = listFilesRecursively(movieDirectory);

  // Search for the file with the movie name
  const movieFile = files.find((file) =>
    file.toLowerCase().includes(decodedMovieName.toLowerCase())
  );

  if (!movieFile) {
    console.error(`Movie file not found: ${decodedMovieName}`);
    return res.status(404).json({ error: "Movie not found" });
  }

  const fullPath = movieFile; // Full path to the movie file

  // Check if the video codec is HEVC (H.265)
  checkCodecAndTranscode(fullPath, res);
});

// Helper function to check codec and handle transcoding
function checkCodecAndTranscode(fullPath, res) {
  // Get file extension
  const extension = path.extname(fullPath).toLowerCase();

  // FFmpeg command to check video codec
  const codecCheckCommand = `ffmpeg -i "${fullPath}" 2>&1 | grep Video`;

  exec(codecCheckCommand, (err, stdout) => {
    if (err) {
      console.error("Error checking video codec:", err);
      return res.status(500).json({ error: "Error checking video codec" });
    }

    if (stdout.includes("hevc")) {
      // If the video uses HEVC (H.265), transcode to H.264 on the fly
      console.log(`Transcoding ${fullPath} from HEVC to H.264 on the fly`);

      const ffmpegCommand = `ffmpeg -i "${fullPath}" -c:v libx264 -f mp4 -movflags frag_keyframe+empty_moov pipe:1`;

      const ffmpegProcess = exec(ffmpegCommand, {
        maxBuffer: 1024 * 1024 * 500,
      });

      res.setHeader("Content-Type", "video/mp4");
      ffmpegProcess.stdout.pipe(res);
    } else {
      // If the video is already compatible, stream it directly
      console.log(`Serving movie: ${fullPath}`);
      res.sendFile(fullPath);
    }
  });
}

// Helper function to list files recursively
const listFilesRecursively = (dirPath) => {
  let results = [];

  const listFiles = (folderPath) => {
    const items = fs.readdirSync(folderPath); // Read directory contents

    items.forEach((item) => {
      const fullPath = path.join(folderPath, item);
      const stat = fs.statSync(fullPath);

      if (stat && stat.isDirectory()) {
        // Recursively go through subfolders
        listFiles(fullPath);
      } else {
        // Add the file path
        results.push(fullPath);
      }
    });
  };

  listFiles(dirPath);
  return results;
};

export default router;
// router.get("/play/:movieName", (req, res) => {
//   const encodedMovieName = req.params.movieName;
//   const decodedMovieName = decodeURIComponent(encodedMovieName); // Decode the encoded URL

//   // Base directory where the movies are stored
//   const movieDirectory = "D:/Radarr-Movies";

//   // Recursively find the movie in the directory
//   const files = listFilesRecursively(movieDirectory);

//   // Search for the file with the movie name
//   const movieFile = files.find((file) =>
//     file.toLowerCase().includes(decodedMovieName.toLowerCase())
//   );

//   if (!movieFile) {
//     console.error(`Movie file not found: ${decodedMovieName}`);
//     return res.status(404).json({ error: "Movie not found" });
//   }

//   const fullPath = movieFile; // Already absolute path

//   // Check if the file is an .mkv
//   const extension = path.extname(fullPath).toLowerCase();
//   if (extension === ".mkv") {
//     console.log(`Transcoding ${fullPath} to .mp4 on the fly`);

//     // Use FFmpeg to transcode the .mkv file to .mp4 on the fly
//     res.setHeader("Content-Type", "video/mp4");

//     const ffmpegCommand = `ffmpeg -i "${fullPath}" -f mp4 -movflags frag_keyframe+empty_moov pipe:1`;

//     // Execute FFmpeg and pipe the output to the response
//     const ffmpegProcess = exec(
//       ffmpegCommand,
//       { maxBuffer: 1024 * 1024 * 500 },
//       (error, stdout, stderr) => {
//         if (error) {
//           console.error("Error during FFmpeg transcoding:", error);
//           res.status(500).json({ error: "Error during FFmpeg transcoding" });
//         }
//       }
//     );

//     ffmpegProcess.stdout.pipe(res);
//   } else {
//     // Serve the movie directly if it's not an .mkv file
//     console.log(`Serving movie: ${fullPath}`);
//     res.sendFile(fullPath);
//   }
// });

// Helper function to list files recursively

// const listFilesRecursively = (dirPath) => {
//   let results = [];

//   const listFiles = (folderPath) => {
//     const items = fs.readdirSync(folderPath); // Read directory contents

//     items.forEach((item) => {
//       const fullPath = path.join(folderPath, item);
//       const stat = fs.statSync(fullPath);

//       if (stat && stat.isDirectory()) {
//         // Recursively go through subfolders
//         listFiles(fullPath);
//       } else {
//         // Add the file path
//         results.push(fullPath);
//       }
//     });
//   };

//   listFiles(dirPath);
//   return results;
// };

// API route to play a video file
// router.get("/play/:movieName", (req, res) => {
//   const encodedMovieName = req.params.movieName;
//   const decodedMovieName = decodeURIComponent(encodedMovieName); // Decode the encoded URL

//   // Base directory where the movies are stored
//   const movieDirectory = "D:/Radarr-Movies";

//   // Recursively find the movie in the directory
//   const files = listFilesRecursively(movieDirectory);

//   // Search for the file with the movie name
//   const movieFile = files.find((file) =>
//     file.toLowerCase().includes(decodedMovieName.toLowerCase())
//   );

//   if (!movieFile) {
//     console.error(`Movie file not found: ${decodedMovieName}`);
//     return res.status(404).json({ error: "Movie not found" });
//   }

//   // Serve the movie file directly since it's already an absolute path
//   console.log(`Serving movie: ${movieFile}`);
//   res.sendFile(movieFile);
// });

// Helper function to list files recursively (now returning absolute paths)
// const listFilesRecursively = (dirPath) => {
//   let results = [];

//   const listFiles = (folderPath) => {
//     const items = fs.readdirSync(folderPath); // Read directory contents

//     items.forEach((item) => {
//       const fullPath = path.join(folderPath, item); // Full absolute path
//       const stat = fs.statSync(fullPath);

//       if (stat && stat.isDirectory()) {
//         // Recursively go through subfolders
//         listFiles(fullPath);
//       } else {
//         // Push the absolute file path to results
//         results.push(fullPath);
//       }
//     });
//   };

//   listFiles(dirPath);
//   return results;
// };
