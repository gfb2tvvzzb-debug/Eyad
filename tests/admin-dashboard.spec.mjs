import assert from 'node:assert/strict';
import { isAdminEmail, buildDashboardRows } from '../server/admin.js';

assert.equal(isAdminEmail('eyad.bassem98@hotmail.com'), true);
assert.equal(isAdminEmail('client@example.com'), false);

const rows = buildDashboardRows([
  { id: 1, email: 'client@example.com', full_name: 'Client One' },
  { id: 2, email: 'other@example.com', full_name: 'Client Two' },
], [
  { user_id: 1, assignment_key: 'nutrition-assessment', status: 'sent' },
  { user_id: 1, assignment_key: 'dietary-log', status: 'submitted' },
], [
  { user_id: 1, assignment_key: 'dietary-log', summary: 'submitted', submitted_at: '2026-08-29T00:00:00Z' },
]);

assert.equal(rows[0].forms['nutrition-assessment'].status, 'sent');
assert.equal(rows[0].forms['dietary-log'].status, 'submitted');
assert.equal(rows[1].forms['nutrition-assessment']?.status ?? 'not-assigned', 'not-assigned');

console.log('admin dashboard spec passed');
