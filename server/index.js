'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const tg = require('./telegram');
const store = require('./store');
const host = require('./engine-host');
const ton = require('./ton');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon',
  '.csv': 'text/csv; charset=utf-8', '.md': 'text/markdown; charset=utf-8'
};

function json(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(data),
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': config.origin(),
    'Access-Control-Allow-Headers': 'Content-Type, X-Rifty-Token, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  });
  res.end(data);
}
function ok(res, data) { json(res, 200, { ok: true, ...data }); }
function bad(res, error, status = 400) { json(res, status, { ok: false, error: String(error) }); }

function body(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) { reject(new Error('err_request_failed')); req.destroy(); }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch { reject(new Error('err_invalid_parameters')); }
    });
    req.on('error', reject);
  });
}

function session(req) {
  const header = req.headers['x-rifty-token'] || req.headers.authorization || '';
  const token = String(header).replace(/^Bearer\s+/i, '').trim();
  return store.verify(token) ? { token, ...store.verify(token) } : null;
}
function requireUser(req, res) {
  const s = session(req);
  if (!s) { bad(res, 'loginRequired', 401); return null; }
  return s;
}
function requireAdmin(req, res) {
  const s = requireUser(req, res);
  if (!s) return null;
  const record = store.readUser(s.uid);
  if (!s.admin && !config.isAdmin(record?.user?.id)) { bad(res, 'err_admin_required', 403); return null; }
  return s;
}

function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname).replace(/^\/+/, '');
  if (!rel || rel === '/') rel = 'index.html';
  if (rel.startsWith('server/') || rel.startsWith('data/') || rel.includes('..') || rel.startsWith('.')) {
    res.writeHead(404); res.end('Not found'); return;
  }
  const file = path.resolve(config.root, rel);
  if (!file.startsWith(config.root)) { res.writeHead(404); res.end('Not found'); return; }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': st.size,
      'Cache-Control': ['.html', '.js', '.css', '.json'].includes(ext) ? 'no-cache' : 'public, max-age=3600'
    });
    fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { json(res, 200, {}); return; }
  const url = new URL(req.url, config.origin());
  const p = url.pathname;

  try {
    /* ---------- public config ---------- */
    if (p === '/health' && req.method === 'GET') {
      return ok(res, { status: 'ok', time: Date.now(), telegram: !!config.botToken, tonapi: !!config.tonapiKey, adminIds: config.adminIds.length });
    }
    if (p === '/app-config.json' && req.method === 'GET') {
      const mode = config.botToken && !config.demoMode ? 'live' : 'local';
      return json(res, 200, {
        mode, bot: config.botName, authenticated: !!(config.botToken && !config.demoMode),
        token: { name: 'Mario Coin', symbol: 'COIN', decimals: 9, supplyMode: 'uncapped', maxSupply: null },
        chainConfigured: !!(config.jettonMaster && config.treasury),
        tonConnect: !!config.origin(), adminIds: config.adminIds.length
      });
    }
    if (p === '/tonconnect-manifest.json' && req.method === 'GET') {
      const origin = config.origin();
      return json(res, 200, {
        url: origin + '/',
        name: config.appName,
        iconUrl: origin + '/assets/mario-logo.svg',
        termsOfUseUrl: origin + '/#terms',
        privacyPolicyUrl: origin + '/#privacy'
      });
    }

    /* ---------- authentication ---------- */
    if (p === '/api/auth/telegram' && req.method === 'POST') {
      const data = await body(req);
      const user = tg.verify(data.initData);
      const state = await store.withLock(user.id, () => {
        const existing = store.getState(user.id);
        const s = existing ? host.bootstrap(user.id, user) : host.bootstrap(user.id, user);
        store.upsertUser(user, s);
        return s;
      });
      return ok(res, { token: store.issue(user.id, config.isAdmin(user.id)), user, state,
        isAdmin: config.isAdmin(user.id), config: { jettonMaster: config.jettonMaster, treasury: config.treasury, bot: config.botName } });
    }
    if (p === '/api/auth/demo' && req.method === 'POST') {
      if (!config.demoMode) return bad(res, 'err_admin_required', 403);
      const user = { id: '7641002831', first_name: 'Rift Explorer', username: 'riftexplorer', photo_url: '', is_premium: false, language_code: 'en' };
      const state = await store.withLock(user.id, () => { const s = host.bootstrap(user.id, user); store.upsertUser(user, s); return s; });
      return ok(res, { token: store.issue(user.id, config.isAdmin(user.id)), user, state,
        isAdmin: config.isAdmin(user.id), config: { jettonMaster: config.jettonMaster, treasury: config.treasury, bot: config.botName } });
    }
    if (p === '/api/session/refresh' && req.method === 'POST') {
      const s = requireUser(req, res); if (!s) return;
      return ok(res, { token: store.issue(s.uid, !!s.admin) });
    }

    /* ---------- state ---------- */
    if (p === '/api/bootstrap' && req.method === 'GET') {
      const s = requireUser(req, res); if (!s) return;
      const record = store.readUser(s.uid);
      const state = store.withLock ? await store.withLock(s.uid, () => host.tick(s.uid)) : host.tick(s.uid);
      return ok(res, { state, user: record?.user, isAdmin: !!(s.admin || config.isAdmin(s.uid)),
        config: { jettonMaster: config.jettonMaster, treasury: config.treasury, bot: config.botName, demo: config.demoMode } });
    }
    if (p === '/api/state' && req.method === 'GET') {
      const s = requireUser(req, res); if (!s) return;
      return ok(res, { state: store.getState(s.uid) });
    }

    /* ---------- game actions (server authoritative) ---------- */
    if (p === '/api/action' && req.method === 'POST') {
      const s = requireUser(req, res); if (!s) return;
      const data = await body(req);
      const name = String(data.action || '');
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) return bad(res, 'err_invalid_parameters');
      const isAdminAction = /^(admin|owner)/i.test(name);
      if (isAdminAction && !(s.admin || config.isAdmin(s.uid))) return bad(res, 'err_admin_required', 403);
      try {
        const args = data.args || [];
        let target = s.uid;
        const users = store.allUsers();
        if (name === 'adminDecision') {
          target = users.find((u) => (u.state?.withdrawal?.items || []).some((w) => w.id === args[0]))?.uid || s.uid;
        } else if (name === 'adminModerate' || name === 'adminRiskRefresh') {
          target = String(args[0] || s.uid);
        } else if (name === 'adminTicket') {
          target = users.find((u) => (u.state?.support || []).some((t) => t.id === args[0]))?.uid || s.uid;
        } else if (name === 'adminAmbassador') {
          target = users.find((u) => (u.state?.ambassador?.applications || []).some((a) => a.id === args[0]))?.uid || s.uid;
        }
        const result = await store.withLock(target, () => host.action(target, name, args));
        if (target !== s.uid) {
          result.targetState = result.state;
          result.state = store.getState(s.uid);
        }
        return json(res, 200, result);
      } catch (e) { return bad(res, e.message || 'err_request_failed'); }
    }

    /* ---------- real TON chain ---------- */
    if (p === '/api/wallet/chain' && req.method === 'GET') {
      if (!requireUser(req, res)) return;
      const address = url.searchParams.get('address');
      if (!address) return bad(res, 'err_connect_wallet');
      try { return ok(res, await ton.getChainBalances(address)); }
      catch (e) { return bad(res, e.message); }
    }
    if (p === '/api/wallet/challenge' && req.method === 'POST') {
      const s = requireUser(req, res); if (!s) return;
      return ok(res, { challenge: store.challenge(s.uid) });
    }
    if (p === '/api/wallet/connect' && req.method === 'POST') {
      const s = requireUser(req, res); if (!s) return;
      const data = await body(req);
      const address = String(data.address || '').trim();
      if (!/^(EQ|UQ|kQ|0:)[A-Za-z0-9_-]{20,}$/.test(address)) return bad(res, 'err_invalid_parameters');
      let chain = { ton: 0, hold: 0 };
      try { chain = await ton.getChainBalances(address); } catch {}
      const result = await store.withLock(s.uid, () => host.action(s.uid, 'syncChain', [{
        address, rawAddress: address, ton: chain.ton, hold: chain.hold, verified: false
      }]));
      return json(res, 200, result);
    }
    if (p === '/api/wallet/verify' && req.method === 'POST') {
      const s = requireUser(req, res); if (!s) return;
      const data = await body(req);
      const challenge = String(data.challenge || '');
      const state = store.getState(s.uid);
      const address = state?.wallet?.address;
      if (!address || !challenge) return bad(res, 'err_invalid_parameters');
      let found = null;
      try { found = await ton.findInbound({ from: address, challenge, minNano: 49000000 }); } catch (e) { return bad(res, e.message); }
      if (!found) return ok(res, { confirmed: false });
      const result = await store.withLock(s.uid, () => host.action(s.uid, 'verifyChainWallet', [found.hash]));
      return json(res, 200, { ...result, transaction: found });
    }
    if (p === '/api/wallet/deposit' && req.method === 'POST') {
      const s = requireUser(req, res); if (!s) return;
      const data = await body(req);
      const challenge = String(data.challenge || '');
      const state = store.getState(s.uid);
      if (!state?.wallet?.address || !challenge) return bad(res, 'err_invalid_parameters');
      let found = null;
      try {
        found = await ton.findJettonDeposit({
          from: state.wallet.address,
          expectedUnits: data.units ? Number(data.units) : 0,
          minUnits: Number(data.amount) || 5000
        });
      } catch (e) { return bad(res, e.message); }
      if (!found) return ok(res, { confirmed: false });
      const credited = Number(data.amount) || Math.floor(found.amount);
      const result = await store.withLock(s.uid, () => host.action(s.uid, 'chainDeposit', [credited]));
      return json(res, 200, { ...result, transaction: found });
    }
    if (p === '/api/withdrawal/mark-paid' && req.method === 'POST') {
      const s = requireAdmin(req, res); if (!s) return;
      const data = await body(req);
      const hash = String(data.txHash || '');
      const check = await ton.transactionStatus(hash);
      if (!check.found) return bad(res, 'err_invalid_parameters');
      const owner = store.allUsers().find((u) => (u.state?.withdrawal?.items || []).some((w) => w.id === data.id));
      if (!owner) return bad(res, 'err_request_failed');
      const result = await store.withLock(owner.uid, () => host.action(owner.uid, 'adminMarkPaid', [data.id, hash]));
      return json(res, 200, result);
    }

    /* ---------- admin listing (server-side source of truth) ---------- */
    if (p === '/api/admin/users' && req.method === 'GET') {
      if (!requireAdmin(req, res)) return;
      return ok(res, { users: store.allUsers().map((u) => ({
        id: u.uid, name: u.user?.first_name || 'Explorer', username: u.user?.username || '',
        balance: u.state?.mining?.balance || 0, hold: u.state?.wallet?.hold || 0,
        address: u.state?.wallet?.address || '', updatedAt: u.updatedAt
      })) });
    }
    if (p === '/api/admin/withdrawals' && req.method === 'GET') {
      if (!requireAdmin(req, res)) return;
      const items = store.allUsers().flatMap((u) => (u.state?.withdrawal?.items || []).map((w) => ({ ...w, userId: u.uid, name: u.user?.first_name })));
      return ok(res, { items });
    }

    if (req.method === 'GET') return serveStatic(req, res, p);
    return bad(res, 'err_request_failed', 404);
  } catch (e) {
    console.error('[server]', req.method, p, e);
    return bad(res, e.message || 'err_request_failed', 400);
  }
});

server.listen(config.port, config.host, () => {
  console.log(`Rifty backend listening on http://${config.host}:${config.port}`);
  console.log(`Telegram verification: ${config.botToken ? 'ENABLED' : 'DISABLED (set RIFTY_BOT_TOKEN)'}`);
  console.log(`Demo mode: ${config.demoMode ? 'ON' : 'OFF'}`);
  console.log(`Admin IDs: ${config.adminIds.join(', ') || '(none)'}`);
});
