'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('./config');

const USERS = path.join(config.dataDir, 'users');
const locks = new Map();

function file(uid) {
  const safe = String(uid).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
  return path.join(USERS, safe + '.json');
}
function readUser(uid) {
  try { return JSON.parse(fs.readFileSync(file(uid), 'utf8')); } catch { return null; }
}
function writeUser(uid, record) {
  const target = file(uid);
  const tmp = target + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(record));
  fs.renameSync(tmp, target);
}
function getState(uid) { return readUser(uid)?.state || null; }
function saveState(uid, state, meta = {}) {
  const old = readUser(uid) || {};
  writeUser(uid, { ...old, uid: String(uid), state, updatedAt: Date.now(), ...meta });
}
function upsertUser(user, state) {
  const old = readUser(user.id) || {};
  writeUser(user.id, {
    ...old,
    uid: user.id,
    user,
    state,
    createdAt: old.createdAt || Date.now(),
    updatedAt: Date.now()
  });
}
function allUsers() {
  try {
    return fs.readdirSync(USERS).filter((f) => f.endsWith('.json')).map((f) => {
      try { return JSON.parse(fs.readFileSync(path.join(USERS, f), 'utf8')); } catch { return null; }
    }).filter(Boolean);
  } catch { return []; }
}

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', config.sessionSecret).update(body).digest('base64url');
  return body + '.' + sig;
}
function verify(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', config.sessionSecret).update(body).digest('base64url');
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload.uid || payload.exp < Date.now()) return null;
    return payload;
  } catch { return null; }
}
function issue(uid, admin) {
  return sign({ uid: String(uid), admin: !!admin, iat: Date.now(), exp: Date.now() + 30 * 86400000 });
}
function challenge(uid) {
  return crypto.createHmac('sha256', config.sessionSecret).update('verify:' + uid + ':' + Date.now()).digest('hex').slice(0, 24);
}

// Serialise mutations per user so concurrent requests cannot corrupt a state file.
async function withLock(uid, fn) {
  const key = String(uid);
  while (locks.get(key)) await locks.get(key);
  let release;
  const gate = new Promise((r) => { release = r; });
  locks.set(key, gate);
  try { return await fn(); } finally { locks.delete(key); release(); }
}

module.exports = { USERS, readUser, writeUser, getState, saveState, upsertUser, allUsers,
  issue, verify, challenge, withLock };
