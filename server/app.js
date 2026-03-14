import express from "express";

const app = express();

app.get("/api/dice", (req, res) => {
  const roll = Math.floor(Math.random() * 6) + 1;
  res.json({ roll });
});

export default app;
