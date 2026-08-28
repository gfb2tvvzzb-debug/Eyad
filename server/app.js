import express from 'express';
import { initDb } from './db.js';
import { attachAuthRoutes } from './auth.js';

export async function createApiRouter() {
  await initDb();
  const router = express.Router();
  router.use(express.json({ limit: '32kb' }));
  router.get('/health', (_req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ ok: true }));
  });
  attachAuthRoutes(router);
  return router;
}
