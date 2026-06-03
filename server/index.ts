import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { authRouter } from './routes/auth.js';
import { feedbackRouter } from './routes/feedback.js';
import { syncRouter } from './routes/sync.js';
import { sharesRouter } from './routes/shares.js';
import { imagesRouter } from './routes/images.js';

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: '20mb' }));

  app.use('/api/auth', authRouter);
  app.use('/api/feedback', feedbackRouter);
  app.use('/api/sync', syncRouter);
  app.use('/api/shares', sharesRouter);
  app.use('/api/images', imagesRouter);

  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
