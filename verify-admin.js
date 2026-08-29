import assert from 'node:assert/strict';
import { buildDashboardRows, isAdminEmail } from './server/admin.js';

assert.equal(isAdminEmail('eyad.bassem98@hotmail.com'), true);
assert.equal(isAdminEmail('client@example.com'), false);

const rows = buildDashboardRows(
  [{ id: 1, email: 'a@a.com', full_name: 'A' }],
  [{ user_id: 1, assignment_key: 'dietary-log', status: 'sent', assigned_at: '2026-08-29', sent_at: '2026-08-29' }],
  [{ user_id: 1, assignment_key: 'dietary-log', summary: 'done', submitted_at: '2026-08-29T10:00:00Z' }]
);

assert.equal(rows[0].forms['dietary-log'].status, 'submitted');
console.log('verify-admin: ok');
