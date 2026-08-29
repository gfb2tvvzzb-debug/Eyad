#!/usr/bin/env node
import fetch from 'node-fetch';
import https from 'https';

const BASE_URL = 'http://localhost:3001/api';

// Suppress SSL warnings for localhost
const agent = new https.Agent({
  rejectUnauthorized: false,
});

async function req(method, path, body = null) {
  const url = `${BASE_URL}${path}`;
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': this.cookies || '',
    },
    agent,
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  
  // Save cookies
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) this.cookies = setCookie.split(';')[0];

  return { status: res.status, data };
}

async function test() {
  const context = { cookies: '' };
  const boundReq = req.bind(context);

  console.log('=== E2E Test: Admin Invite → Client Notification → Form Submission ===\n');

  // Step 1: Create admin user
  console.log('1. Register admin...');
  let res = await boundReq('POST', '/register', {
    email: 'eyad.bassem98@hotmail.com',
    password: 'admin123',
    fullName: 'Admin User',
  });
  console.log(`   Status: ${res.status} ${res.data.error || '✓'}\n`);

  // Step 2: Admin login
  console.log('2. Admin login...');
  context.cookies = '';
  res = await boundReq('POST', '/login', {
    email: 'eyad.bassem98@hotmail.com',
    password: 'admin123',
  });
  console.log(`   Status: ${res.status} ${res.data.error || '✓'}\n`);
  const adminCookie = context.cookies;

  // Step 3: Get admin dashboard (verify admin access)
  console.log('3. Get admin dashboard...');
  res = await boundReq('GET', '/admin/dashboard');
  console.log(`   Status: ${res.status} ${res.data.error || `✓ (${res.data.users?.length || 0} users)`}\n`);

  // Step 4: Create client user
  console.log('4. Register client...');
  context.cookies = '';
  res = await boundReq('POST', '/register', {
    email: 'client@example.com',
    password: 'client123',
    fullName: 'Test Client',
  });
  console.log(`   Status: ${res.status} ${res.data.error || '✓'}\n`);
  const clientId = res.data.user?.id;

  // Step 5: Admin sends invite
  console.log('5. Admin sends invite to client...');
  context.cookies = adminCookie;
  res = await boundReq('POST', '/admin/assign-form', {
    userId: clientId,
    assignmentKey: 'nutrition-assessment',
  });
  console.log(`   Status: ${res.status} ${res.data.error || '✓'}\n`);

  // Step 6: Client checks notifications
  console.log('6. Client checks notifications...');
  context.cookies = '';
  res = await boundReq('POST', '/login', {
    email: 'client@example.com',
    password: 'client123',
  });
  res = await boundReq('GET', '/notifications');
  const unread = (res.data.notifications || []).filter(n => !n.isRead);
  console.log(`   Status: ${res.status} ${res.data.error || `✓ (${unread.length} unread)`}\n`);
  if (unread.length > 0) {
    console.log(`   → Notification: "${unread[0].title}"\n`);
  }

  // Step 7: Client submits form
  console.log('7. Client submits form...');
  res = await boundReq('POST', '/assignments', {
    assignmentKey: 'nutrition-assessment',
    answers: { dietary_habits: 'balanced', goal: 'weight loss' },
    summary: 'Client completed nutrition assessment',
  });
  console.log(`   Status: ${res.status} ${res.data.error || '✓'}\n`);

  // Step 8: Admin views completed forms
  console.log('8. Admin views completed forms in dashboard...');
  context.cookies = adminCookie;
  res = await boundReq('GET', '/admin/dashboard');
  const submissions = res.data.submissions || [];
  console.log(`   Status: ${res.status} ${res.data.error || `✓ (${submissions.length} submissions)`}\n`);
  if (submissions.length > 0) {
    console.log(`   → Found submission: ${submissions[0].fullName} - ${submissions[0].assignmentTitle}\n`);
  }

  console.log('=== ✓ E2E Flow Complete ===\n');
  process.exit(0);
}

test().catch(err => {
  console.error('Test failed:', err.message);
  process.exit(1);
});
