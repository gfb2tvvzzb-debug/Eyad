import express from 'express';
import { initDb } from './db.js';
import { attachAuthRoutes } from './auth.js';
import { attachAssignmentRoutes } from './assignments.js';
import { attachAdminRoutes } from './admin.js';

export async function createApiRouter() {
  await initDb();
  const router = express.Router();
  router.use(express.json({ limit: '512kb' }));
  router.get('/health', (_req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ ok: true }));
  });
  attachAuthRoutes(router);
  attachAssignmentRoutes(router);
  attachAdminRoutes(router);
  return router;
}
