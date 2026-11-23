'use strict';
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');

// Minimal .env loader (no dependencies). Environment variables take precedence.
try {
  const envText = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
  for (const line of envText.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
} catch {}

const DATA_DIR = path.join(ROOT, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(path.join(DATA_DIR, 'users'), { recursive: true });

function str(name, fallback = '') {
  return process.env[name] !== undefined && process.env[name] !== '' ? process.env[name] : fallback;
}
function int(name, fallback) {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

const config = {
  root: ROOT,
  dataDir: DATA_DIR,
  port: int('PORT', 8080),
  host: str('HOST', '0.0.0.0'),
  botToken: str('RIFTY_BOT_TOKEN'),
  botName: str('RIFTY_BOT_NAME', 'mariocoinbot'),
  adminIds: str('RIFTY_ADMIN_IDS').split(',').map((x) => x.trim()).filter(Boolean),
  tonapiKey: str('RIFTY_TONAPI_KEY'),
  tonapiBase: str('RIFTY_TONAPI_BASE', 'https://tonapi.io/v2'),
  jettonMaster: str('RIFTY_JETTON_MASTER'),
  treasury: str('RIFTY_TREASURY'),
  publicUrl: str('RIFTY_PUBLIC_URL', ''),
  sessionSecret: str('RIFTY_SESSION_SECRET') || require('crypto').randomBytes(32).toString('hex'),
  demoMode: str('RIFTY_DEMO_MODE', 'true') === 'true',
  chain: str('RIFTY_CHAIN', '-239'),
  appName: 'Mario Bros: Coin Quest'
};

config.isAdmin = (id) => config.adminIds.includes(String(id));
config.isConfigured = () => !!(config.botToken && config.treasury && config.jettonMaster);
config.origin = () => config.publicUrl.replace(/\/$/, '') || `http://localhost:${config.port}`;

module.exports = config;
