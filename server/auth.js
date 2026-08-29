import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { getDb } from './db.js';

const scryptAsync = promisify(scrypt);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;
const REMEMBER_MS = 30 * 24 * 60 * 60 * 1000;
const COOKIE_NAME = 'eb_session';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function publicUser(row) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    phoneCountry: row.phone_country || '',
    phone: row.phone || '',
    dob: row.dob || '',
    gender: row.gender || '',
    address: row.address || '',
    height: row.height || '',
    weight: row.weight || '',
  };
}

async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, 32);
  return salt.toString('hex') + ':' + hash.toString('hex');
}

async function verifyPassword(password, stored) {
  const parts = String(stored || '').split(':');
  if (parts.length !== 2) return false;
  const salt = Buffer.from(parts[0], 'hex');
  const expected = Buffer.from(parts[1], 'hex');
  if (!salt.length || expected.length !== 32) return false;
  const actual = await scryptAsync(password, salt, 32);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  String(header).split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    try {
      out[key] = decodeURIComponent(value);
    } catch (err) {
      out[key] = value;
    }
  });
  return out;
}

function setSessionCookie(res, sessionId, maxAgeMs) {
  const parts = [
    COOKIE_NAME + '=' + encodeURIComponent(sessionId),
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=' + Math.floor(maxAgeMs / 1000),
  ];
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', COOKIE_NAME + '=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
}

function createSession(userId, remember) {
  const db = getDb();
  const id = randomBytes(32).toString('hex');
  const maxAge = remember ? REMEMBER_MS : SESSION_MS;
  const expiresAt = Date.now() + maxAge;
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
  db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').run(id, userId, expiresAt);
  return { id, maxAge };
}

export function getUserFromRequest(req) {
  const cookies = parseCookies(req.headers.cookie);
  const sessionId = cookies[COOKIE_NAME];
  if (!sessionId) return null;
  const row = getDb().prepare(`
    SELECT users.* FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.id = ? AND sessions.expires_at > ?
  `).get(sessionId, Date.now());
  return row || null;
}

export function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

export function requireUser(req, res) {
  const user = getUserFromRequest(req);
  if (!user) {
    sendJson(res, 401, { error: 'Sign in to continue.' });
    return null;
  }
  return user;
}

export function attachAuthRoutes(router) {
  router.post('/register', async (req, res) => {
    try {
      const body = req.body || {};
      const fullName = String(body.fullName || '').trim();
      const email = normalizeEmail(body.email);
      const password = String(body.password || '');
      const phoneCountry = String(body.phoneCountry || '').trim();
      const phone = String(body.phone || '').trim();
      const dob = String(body.dob || '').trim();
      const gender = String(body.gender || '').trim();
      const address = String(body.address || '').trim();
      const height = String(body.height || '').trim();
      const weight = String(body.weight || '').trim();

      if (!fullName) return sendJson(res, 400, { error: 'Full name is required.' });
      if (!EMAIL_RE.test(email)) return sendJson(res, 400, { error: 'Enter a valid email address.' });
      if (password.length < 8) return sendJson(res, 400, { error: 'Password must be at least 8 characters.' });
      if (!phone || !dob || !gender || !address || !height || !weight) {
        return sendJson(res, 400, { error: 'Please complete all fields.' });
      }

      const db = getDb();
      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existing) return sendJson(res, 409, { error: 'An account with that email already exists.' });

      const passwordHash = await hashPassword(password);
      const info = db.prepare(`
        INSERT INTO users (email, password_hash, full_name, phone_country, phone, dob, gender, address, height, weight)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(email, passwordHash, fullName, phoneCountry, phone, dob, gender, address, height, weight);

      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
      const session = createSession(user.id, true);
      setSessionCookie(res, session.id, session.maxAge);
      return sendJson(res, 201, { user: publicUser(user) });
    } catch (err) {
      if (err && /UNIQUE constraint failed/i.test(String(err.message || ''))) {
        return sendJson(res, 409, { error: 'An account with that email already exists.' });
      }
      console.error('register failed', err);
      return sendJson(res, 500, { error: 'Could not create the account.' });
    }
  });

  router.post('/login', async (req, res) => {
    try {
      const body = req.body || {};
      const email = normalizeEmail(body.email);
      const password = String(body.password || '');
      const remember = Boolean(body.remember);

      if (!EMAIL_RE.test(email) || !password) {
        return sendJson(res, 400, { error: 'Enter a valid email and password.' });
      }

      const user = getDb().prepare('SELECT * FROM users WHERE email = ?').get(email);
      const ok = user ? await verifyPassword(password, user.password_hash) : await verifyPassword(password, '00'.repeat(16) + ':' + '00'.repeat(32));
      if (!user || !ok) {
        return sendJson(res, 401, { error: 'Invalid email or password.' });
      }

      const session = createSession(user.id, remember);
      setSessionCookie(res, session.id, session.maxAge);
      return sendJson(res, 200, { user: publicUser(user) });
    } catch (err) {
      console.error('login failed', err);
      return sendJson(res, 500, { error: 'Could not sign in.' });
    }
  });

  router.post('/logout', (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    const sessionId = cookies[COOKIE_NAME];
    if (sessionId) {
      getDb().prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
    }
    clearSessionCookie(res);
    sendJson(res, 200, { ok: true });
  });

  router.get('/me', (req, res) => {
    const user = getUserFromRequest(req);
    if (!user) return sendJson(res, 401, { error: 'Not signed in.' });
    sendJson(res, 200, { user: publicUser(user) });
  });
}
