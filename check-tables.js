import { initDb, getDb } from './server/db.js';

await initDb();
const db = getDb();
const user = db.prepare('SELECT id FROM users LIMIT 1').get();
if (!user) {
  console.log('no users');
  process.exit(0);
}
const info = db.prepare(`
  INSERT INTO assignment_submissions (user_id, assignment_key, assignment_title, payload, summary)
  VALUES (?, ?, ?, ?, ?)
`).run(user.id, 'nutrition-assessment', 'Nutrition Assessment', '{"fields":{"test":"1"}}', 'test summary');
console.log('inserted', info.lastInsertRowid);
console.log(db.prepare('SELECT id, user_id, assignment_key, submitted_at FROM assignment_submissions').all());
