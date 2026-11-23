'use strict';
const config = require('./config');

async function request(pathname, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = { Accept: 'application/json' };
    if (config.tonapiKey) headers.Authorization = 'Bearer ' + config.tonapiKey;
    const res = await fetch(config.tonapiBase + pathname, { headers, signal: controller.signal });
    if (!res.ok) throw new Error('err_chain_unavailable');
    return await res.json();
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('err_chain_unavailable');
    throw e;
  } finally { clearTimeout(timer); }
}

function nano(n) { return Number(n || 0) / 1e9; }
function units(n, decimals = 9) { return Number(n || 0) / Math.pow(10, decimals); }
function norm(addr) {
  const s = String(addr || '');
  if (s.startsWith('0:')) return s.slice(2).toLowerCase();
  if (/^(EQ|UQ|kQ|Ef|Uf)/.test(s)) {
    try { return Buffer.from(s, 'base64url').subarray(2).toString('hex'); } catch {}
  }
  return s.toLowerCase();
}

function masterOf(item) {
  return item?.jetton_info?.address || item?.jetton_info?.content?.address ||
    item?.jetton?.address || item?.master?.address || '';
}

async function getChainBalances(address) {
  if (!address) return { ton: 0, hold: 0, ok: false };
  const [account, jettons] = await Promise.allSettled([
    request('/accounts/' + encodeURIComponent(address)),
    request('/accounts/' + encodeURIComponent(address) + '/jettons')
  ]);
  const ton = account.status === 'fulfilled' ? nano(account.value?.balance) : 0;
  let hold = 0;
  if (jettons.status === 'fulfilled' && config.jettonMaster) {
    const list = jettons.value?.balances || [];
    const match = list.find((x) => norm(masterOf(x)) === norm(config.jettonMaster)) ||
      list.find((x) => /COIN/i.test(x?.jetton_info?.symbol || x?.jetton_info?.name || ''));
    if (match) hold = units(match.balance, Number(match.jetton_info?.decimals ?? 9));
  }
  return { ton: Math.max(0, ton), hold: Math.max(0, hold), ok: account.status === 'fulfilled' };
}

function commentOf(msg) {
  if (!msg) return '';
  return String(msg.decoded_comment || msg.comment || msg.decoded?.comment || '');
}

function sourceOf(msg) {
  return String(msg?.source?.address || msg?.source || '');
}

async function findInbound({ from, minNano = 0, maxAgeMs = 10 * 60000 }) {
  if (!config.treasury) return null;
  const data = await request('/accounts/' + encodeURIComponent(config.treasury) + '/transactions?limit=30');
  const txs = data?.transactions || [];
  const nowSec = Date.now() / 1000;
  for (const tx of txs) {
    const msg = tx.in_msg || {};
    const comment = commentOf(msg);
    if (from && norm(sourceOf(msg)) !== norm(from)) continue;
    if (Number(msg.value || 0) < minNano) continue;
    if (nowSec - Number(tx.utime || 0) > maxAgeMs / 1000) continue;
    return { hash: tx.hash || '', amount: nano(msg.value), comment, utime: tx.utime };
  }
  return null;
}

async function findJettonDeposit({ from, expectedUnits, minUnits = 0, maxAgeMs = 60 * 60000 }) {
  if (!config.treasury) return null;
  const data = await request('/accounts/' + encodeURIComponent(config.treasury) + '/events?limit=25');
  const events = data?.events || [];
  const nowSec = Date.now() / 1000;
  for (const ev of events) {
    if (nowSec - Number(ev.timestamp || 0) > maxAgeMs / 1000) continue;
    for (const action of ev.actions || []) {
      const type = String(action.type || '');
      if (!/JettonTransfer/i.test(type)) continue;
      const d = action.JettonTransfer || action.jettonTransfer || {};
      const sender = String(d.sender?.address || d.sender || '');
      if (from && norm(sender) !== norm(from)) continue;
      const raw = Number(d.amount || 0);
      if (expectedUnits && Math.abs(raw - Number(expectedUnits)) > 0.5) continue;
      const amount = units(raw, Number(d.jetton?.decimals ?? 9));
      if (!expectedUnits && amount < minUnits) continue;
      return { hash: ev.event_id || ev.lt || '', amount: Math.max(0, amount - (expectedUnits ? 0.000001 : 0)), raw, timestamp: ev.timestamp };
    }
  }
  return null;
}

async function transactionStatus(hash) {
  if (!hash) return { found: false };
  try {
    const data = await request('/transactions/' + encodeURIComponent(hash));
    return { found: true, hash: data?.hash || hash, success: data?.description?.type === 'generic' };
  } catch { return { found: false }; }
}

module.exports = { request, getChainBalances, findInbound, findJettonDeposit, transactionStatus,
  masterOf, nano, units };
