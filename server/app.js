import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.json({ message: "backend is running!!!!" });
});

app.get("/health", (req, res) => {
  res.send("ok");
});

export default app;
