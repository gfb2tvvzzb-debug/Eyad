import { getDb } from './db.js';
import { requireUser, sendJson } from './auth.js';

export const ASSIGNMENTS = {
  'nutrition-assessment': 'Nutrition Assessment',
  'dietary-log': 'Dietary Log',
  'exercise-history': 'Exercise History',
  'food-preferences': 'Food Preferences',
  'health-history': 'Health History',
};

function publicSubmission(row) {
  let payload = {};
  try {
    payload = JSON.parse(row.payload || '{}');
  } catch (err) {
    payload = {};
  }
  return {
    id: row.id,
    userId: row.user_id,
    assignmentKey: row.assignment_key,
    assignmentTitle: row.assignment_title,
    payload,
    summary: row.summary || '',
    submittedAt: row.submitted_at,
  };
}

export function attachAssignmentRoutes(router) {
  router.post('/assignments', (req, res) => {
    try {
      const user = requireUser(req, res);
      if (!user) return;

      const body = req.body || {};
      const assignmentKey = String(body.assignmentKey || '').trim();
      const title = ASSIGNMENTS[assignmentKey];
      if (!title) return sendJson(res, 400, { error: 'Unknown assignment.' });

      const payload = body.payload && typeof body.payload === 'object' ? body.payload : {};
      const summary = String(body.summary || '');
      let payloadJson;
      try {
        payloadJson = JSON.stringify(payload);
      } catch (err) {
        return sendJson(res, 400, { error: 'Could not save the form answers.' });
      }
      if (payloadJson.length > 400000) {
        return sendJson(res, 413, { error: 'This submission is too large to save.' });
      }

      const db = getDb();
      const info = db.prepare(`
        INSERT INTO assignment_submissions (user_id, assignment_key, assignment_title, payload, summary)
        VALUES (?, ?, ?, ?, ?)
      `).run(user.id, assignmentKey, title, payloadJson, summary);

      const row = db.prepare('SELECT * FROM assignment_submissions WHERE id = ?').get(info.lastInsertRowid);
      return sendJson(res, 201, { submission: publicSubmission(row) });
    } catch (err) {
      console.error('save assignment failed', err);
      return sendJson(res, 500, { error: 'Could not save the assignment.' });
    }
  });

  router.get('/assignments', (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    const rows = getDb().prepare(`
      SELECT * FROM assignment_submissions
      WHERE user_id = ?
      ORDER BY submitted_at DESC, id DESC
    `).all(user.id);
    sendJson(res, 200, { submissions: rows.map(publicSubmission) });
  });
}
