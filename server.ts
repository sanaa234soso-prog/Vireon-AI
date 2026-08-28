import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import express from 'express';
import { createExpressApp } from './server/app.js';
import { startWatchdog } from './server/watchdog.js';
import { startBackgroundWorkers } from './server/queue.js';

dotenv.config();

async function startServer() {
  const app = createExpressApp();
  const PORT = 3000;

  // Start 24/7 Watchdog background loop & Autonomous Worker queues
  startWatchdog();
  startBackgroundWorkers();

  // Vite middleware for development, or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Vireon AI Command Center server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
