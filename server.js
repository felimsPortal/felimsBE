import app from "./app.js";

const port = process.env.PORT || 5432;

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
