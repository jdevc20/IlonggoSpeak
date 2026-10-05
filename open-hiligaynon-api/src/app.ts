import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import sentenceRoutes from "./routes/sentence.routes.js";
import engineRoutes from "./routes/engine.routes.js";

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin is not allowed by CORS."));
    },
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "1mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/sentences", sentenceRoutes);
app.use("/api/engine", engineRoutes);

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "ilonggo-speak-api",
    access: "team-only",
    engine: "linguistic-data-v2",
  });
});

export default app;
