/* Mario Bros backend adapter: real Telegram auth, server-side state, real TON Connect wallet. */
(function (global) {
  'use strict';
  const E = global.ENGINE;
  const TOKEN_KEY = 'mario_session_token';
  let token = sessionStorage.getItem(TOKEN_KEY) || '';
  let ready = false, remote = false, user = null, state = null, config = {}, isAdmin = false;
  let ton = null, connecting = false;

  async function api(path, body, method = 'POST') {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['X-Mario-Token'] = token;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    let res;
    try {
      res = await fetch(path, {
        method, headers, credentials: 'same-origin', signal: controller.signal,
        body: method === 'POST' ? JSON.stringify(body || {}) : undefined
      });
    } catch (e) { throw new Error('connectionError'); }
    finally { clearTimeout(timer); }
    let data;
    try { data = await res.json(); } catch { throw new Error('err_request_failed'); }
    if (!res.ok || data.ok === false) throw new Error(data.error || 'err_request_failed');
    return data;
  }

  function applyState(next) { if (next) { state = next; E.setState(next); } }

  async function boot(initData) {
    let data;
    if (initData) data = await api('/api/auth/telegram', { initData });
    else data = await api('/api/auth/demo', {});
    token = data.token;
    sessionStorage.setItem(TOKEN_KEY, token);
    user = data.user; config = data.config || {}; ready = true; remote = true;
    isAdmin = !!data.isAdmin;
    if (data.state?.admin) data.state.admin.isAdmin = isAdmin;
    applyState(data.state);
    wrapActions();
    await refreshAdmin();
    await initTon();
    return data;
  }

  async function refreshAdmin() {
    if (!ready || !isAdmin) return;
    try {
      const [wd, users] = await Promise.all([
        api('/api/admin/withdrawals', undefined, 'GET'),
        api('/api/admin/users', undefined, 'GET')
      ]);
      if (state) {
        state.adminWithdrawals = wd.items || [];
        state.adminUsers = users.users || [];
      }
    } catch (e) { console.warn('admin sync', e); }
  }

  function wrapActions() {
    Object.keys(E.actions).forEach((name) => {
      if (['connectWallet', 'verifyWallet', 'deposit', 'refreshWallet', 'disconnectWallet'].includes(name)) return;
      E.actions[name] = async function (...args) {
        const r = await api('/api/action', { action: name, args });
        applyState(r.state);
        return { ok: r.ok, data: r.data, error: r.error };
      };
    });
    E.actions.connectWallet = connectWallet;
    E.actions.verifyWallet = verifyWallet;
    E.actions.deposit = deposit;
    E.actions.refreshWallet = refreshWallet;
    E.actions.disconnectWallet = disconnectWallet;
  }

  async function initTon() {
    const SDK = global.TON_CONNECT_UI;
    if (!SDK || !SDK.TonConnectUI) return null;
    try {
      ton = new SDK.TonConnectUI({
        manifestUrl: location.origin + '/tonconnect-manifest.json',
        actionsConfiguration: {
          twaReturnUrl: 'https://t.me/' + (config.bot || 'mariocoinbot') + '?startapp=app',
          returnStrategy: 'back'
        },
        uiPreferences: { theme: 'DARK' }
      });
      ton.onStatusChange((wallet) => {
        if (!wallet?.account?.address) return;
        global.dispatchEvent(new CustomEvent('mario:wallet', { detail: wallet }));
      });
      await Promise.race([
        ton.connectionRestored ? ton.connectionRestored.catch(() => null) : Promise.resolve(null),
        new Promise((r) => setTimeout(r, 1200))
      ]);
      if (ton.account?.address) {
        await api('/api/wallet/connect', { address: ton.account.address });
        const fresh = await api('/api/bootstrap', undefined, 'GET');
        applyState(fresh.state);
      }
    } catch (e) { console.warn('TonConnect init', e); }
    return ton;
  }

  async function connectWallet() {
    if (!ton) {
      // Fallback: no TON Connect SDK loaded → ask through the in-app modal.
      const ask = global.APP?.promptModal || (async (title, label, ph) => global.prompt(label, ph));
      const addr = await ask('connectWallet', 'Masukkan alamat dompet TON Anda (EQ… / UQ…):', 'EQ...');
      if (!addr) return { ok: false, error: 'err_connect_wallet' };
      const r = await api('/api/wallet/connect', { address: addr.trim() });
      applyState(r.state);
      return { ok: true, data: { address: addr } };
    }
    if (connecting) return { ok: false, error: 'err_operation_in_progress' };
    connecting = true;
    try {
      if (!ton.connected) await ton.openModal();
      const address = ton.account?.address;
      if (!address) return { ok: false, error: 'err_connect_wallet' };
      const r = await api('/api/wallet/connect', { address });
      applyState(r.state);
      return { ok: true, data: { address } };
    } finally { connecting = false; }
  }

  async function refreshWallet() {
    const address = state?.wallet?.address;
    if (!address) return { ok: false, error: 'err_connect_wallet' };
    const chain = await api('/api/wallet/chain?address=' + encodeURIComponent(address), undefined, 'GET');
    const r = await api('/api/action', { action: 'syncChain', args: [{ address, ...chain }] });
    applyState(r.state);
    return { ok: true, data: chain };
  }

  async function verifyWallet() {
    const address = state?.wallet?.address;
    if (!address) return { ok: false, error: 'err_connect_wallet' };
    if (!ton?.connected) return { ok: false, error: 'err_connect_wallet' };
    if (!config.treasury) return { ok: false, error: 'err_treasury_not_configured' };
    const { challenge } = await api('/api/wallet/challenge', {});
    await ton.sendTransaction({
      validUntil: Math.floor(Date.now() / 1000) + 300,
      network: config.chain || '-239',
      messages: [{ address: config.treasury, amount: '50000000' }]
    }, { modals: ['before', 'success'], notifications: ['before', 'success'] });
    // Poll the chain until the transfer is observed.
    for (let i = 0; i < 24; i++) {
      await new Promise((r) => setTimeout(r, 2500));
      const check = await api('/api/wallet/verify', { challenge });
      if (check.confirmed) { applyState(check.state); return { ok: true, data: check.transaction }; }
    }
    return { ok: false, error: 'err_payment_expired' };
  }

  async function deposit() {
    const address = state?.wallet?.address;
    if (!address) return { ok: false, error: 'err_connect_wallet' };
    if (!ton?.connected) return { ok: false, error: 'err_connect_wallet' };
    if (!config.treasury || !config.jettonMaster) return { ok: false, error: 'err_token_not_configured' };
    const { challenge } = await api('/api/wallet/challenge', {});
    const ask = global.APP?.promptModal || (async (title, label, ph) => global.prompt(label, ph));
    const rawAmount = await ask('depositAmount', 'Jumlah COIN yang ingin disetor (minimal 5.000):', '5000');
    const amount = Number(rawAmount);
    if (!isFinite(amount) || amount < 5000) return { ok: false, error: 'err_invalid_amount' };
    const delta = uniqueDelta(challenge);
    const units = String(Math.round(amount * 1e9) + delta);
    await ton.sendTransaction({
      validUntil: Math.floor(Date.now() / 1000) + 300,
      network: config.chain || '-239',
      items: [{ type: 'jetton', master: config.jettonMaster, amount: units, destination: config.treasury }]
    });
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 2500));
      const check = await api('/api/wallet/deposit', { challenge, amount, units });
      if (check.confirmed) { applyState(check.state); return { ok: true, data: check.transaction }; }
    }
    return { ok: false, error: 'err_payment_expired' };
  }

  async function disconnectWallet() {
    try { if (ton?.connected) await ton.disconnect(); } catch {}
    const r = await api('/api/action', { action: 'disconnectWallet', args: [] });
    applyState(r.state);
    return { ok: true, data: {} };
  }

  // A tiny unique delta makes each deposit amount identifiable on-chain.
  function uniqueDelta(challenge) {
    return parseInt(String(challenge).slice(-6), 16) % 1000000;
  }

  global.BACKEND = {
    api, boot, get ready() { return ready; }, get remote() { return remote; },
    get user() { return user; }, get state() { return state; },
    get config() { return config; }, get ton() { return ton; },
    get token() { return token; }, get isAdmin() { return isAdmin; }, refreshAdmin
  };
})(window);
