/* Mario Bros: Coin Quest - application controller */
(function (global) {
  'use strict';
  const D = global.DATA, E = global.ENGINE, U = global.UI, T = global.I18N;
  const t = T.t, n = T.num;
  const tg = global.Telegram?.WebApp;
  const root = document.getElementById('app');
  const modalRoot = document.getElementById('modal-root');
  const toastRoot = document.getElementById('toast-root');
  const opStatus = document.getElementById('operation-status');

  const ui = {
    stationTab: 'floors', sector: 1, partType: 0, craftType: 1, tier: 0,
    crateKey: 'small', crateFilter: 'all', taskTab: 'all', activity: 'all',
    marketTab: 'buy', tradeAmount: '1', plan: 30, withdrawAmount: '10000',
    adminTab: 'overview'
  };
  let route = 'home', query = '', busy = false, modalConfirm = null, toastTimer = null, bootAt = Date.now();
  let lastRenderRoute = '';

  /* ---------- small helpers ---------- */
  const haptic = (kind = 'impact') => { try { tg?.HapticFeedback?.impactOccurred(kind === 'success' ? 'medium' : 'light'); } catch {} };
  const brand = (s) => String(s == null ? '' : s)
    .replace(/Mario Bros: Coin Quest/g, 'Mario Bros: Coin Quest')
    .replace(/Mario Bros/g, 'Mario Bros')
    .replace(/\bRIFT\b/g, 'COIN')
    .replace(/\bRift\b/g, 'Coin');
  function coinPop(text) {
    const el = document.createElement('div');
    el.className = 'coin-pop';
    el.textContent = brand(text);
    document.body.append(el);
    setTimeout(() => el.remove(), 1300);
  }
  function levelUp(level) {
    const el = document.createElement('div');
    el.className = 'level-up';
    el.innerHTML = `<div>★ LEVEL UP! ★<small>LEVEL ${level} — KEEP GOING!</small></div>`;
    document.body.append(el);
    setTimeout(() => el.remove(), 1700);
  }
  function toast(text, error = false) {
    clearTimeout(toastTimer);
    const safe = brand(text);
    toastRoot.innerHTML = `<div class="toast ${error ? 'error' : ''}">${safe}</div>`;
    if (!error && /^\+|COIN/.test(safe)) coinPop(safe);
    toastTimer = setTimeout(() => { toastRoot.innerHTML = ''; }, 2600);
  }
  function setBusy(v) {
    busy = v;
    opStatus.hidden = !busy;
    if (busy) opStatus.textContent = t('processingAction');
    document.querySelectorAll('button[data-action]').forEach((b) => {
      if (busy && /^(claim-|open-crate:|craft:|install:|upgrade:|confirm-|review-stake|send-ticket|dev:|admin-)/.test(b.dataset.action)) b.disabled = true;
      else if (!busy && b.dataset.pendingDisabled) { b.disabled = false; delete b.dataset.pendingDisabled; }
    });
  }
  function modal(spec) {
    if (!spec) return;
    const isFn = typeof spec.confirm === 'function';
    modalConfirm = isFn ? spec.confirm : null;
    const confirmAction = isFn ? 'confirm-modal' : (spec.confirm || 'close');
    modalRoot.innerHTML = brand(`<div class="modal-backdrop"><div class="modal-card ${spec.className || ''}" role="dialog" aria-modal="true"><div class="modal-head"><h2>${t(spec.title)}</h2><button class="modal-close" data-action="close" aria-label="${t('close')}">${U.I('close')}</button></div><div class="modal-body">${spec.html}</div>${spec.confirm ? `<div class="modal-actions">${btn(t('cancel'), 'close', 'secondary')}${btn(spec.confirmLabel || t('confirm'), confirmAction, 'primary', spec.confirmDisabled ? 'disabled' : '')}</div>` : ''}</div></div>`);
    modalRoot.querySelector('.modal-backdrop')?.addEventListener('click', (e) => { if (e.target.classList.contains('modal-backdrop')) closeModal(); });
  }
  let promptResolve = null;
  function promptModal(title, label, placeholder = '', type = 'text') {
    return new Promise((resolve) => {
      promptResolve = resolve;
      modal({ title, html: `<p class="muted small">${label}</p><input id="prompt-input" type="${type}" placeholder="${placeholder}" autocomplete="off">`, confirmLabel: t('confirm'), confirm: 'prompt-confirm' });
      setTimeout(() => document.getElementById('prompt-input')?.focus(), 60);
    });
  }
  function closeModal() {
    if (promptResolve) { const r = promptResolve; promptResolve = null; r(null); }
    modalRoot.innerHTML = ''; modalConfirm = null;
  }
  function btn(label, action, cls = 'primary', extra = '') {
    return `<button class="btn btn-${cls}" data-action="${action}" ${extra}><span>${label}</span></button>`;
  }
  function openExternal(url) {
    if (!url) return;
    try {
      if (new URL(url).hostname === 't.me' && tg?.openTelegramLink) tg.openTelegramLink(url);
      else if (tg?.openLink) tg.openLink(url);
      else global.open(url, '_blank', 'noopener');
    } catch { global.open(url, '_blank', 'noopener'); }
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const el = document.createElement('textarea'); el.value = text; document.body.append(el); el.select();
      try { document.execCommand('copy'); } catch {} el.remove();
    }
    toast(t('copied'));
  }
  function parseHash() {
    const raw = location.hash.slice(1);
    const [path, qs] = raw.split('?');
    return { route: path || 'home', query: qs || '' };
  }
  function go(to, replace = false) {
    const [path, qs] = to.split('?');
    const known = ['home', 'profile', 'levels', 'mining', 'station', 'crates', 'crafting', 'friends',
      'wallet', 'market', 'staking', 'tasks', 'leagues', 'ambassadors', 'withdraw', 'settings',
      'support', 'admin', 'terms', 'privacy'];
    const target = known.includes(path) ? path : 'home';
    const hash = '#' + target + (qs ? '?' + qs : '');
    if (replace) history.replaceState(null, '', location.pathname + location.search + hash);
    else if (location.hash !== hash) { location.hash = hash; return; }
    route = target; query = qs || '';
    render();
  }
  function back() {
    if (['crates', 'crafting'].includes(route)) go('station');
    else if (route === 'levels') go('leagues');
    else if (route === 'withdraw') go('wallet');
    else go('home');
  }

  const PAGES = {
    home: U.home, mining: U.mining, station: U.station, crates: () => U.cratesPage(false),
    crafting: () => U.workshopPage() + U.sectionTitle('yourInventory') + U.inventoryGrid(),
    friends: U.friends, wallet: U.wallet, market: U.market, staking: U.staking,
    tasks: U.tasks, leagues: U.leagues, levels: U.levels, profile: U.profile,
    ambassadors: U.ambassadors, withdraw: U.withdraw, settings: U.settings,
    support: U.support, admin: U.admin,
    terms: () => U.legal('terms'), privacy: () => U.legal('privacy')
  };
  function render() {
    const s = E.state(); if (!s) return;
    const page = PAGES[route] || U.home;
    const keep = window.scrollY;
    root.innerHTML = brand(U.header(route) + page() + U.bottomNav(route));
    lastRenderRoute = route;
    global.APP.ui = ui; global.APP.query = query; global.APP.route = route;
    try {
      if (tg?.BackButton) {
        const show = !['home', 'mining', 'station', 'tasks', 'wallet'].includes(route);
        if (show) tg.BackButton.show(); else tg.BackButton.hide();
      }
    } catch {}
    updateCalculations();
    if (keep && keep < document.body.scrollHeight) window.scrollTo(0, keep);
  }

  function updateCalculations() {
    const s = E.state(); if (!s) return;
    const v = U.miningView();
    const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
    set('rate-hourly', n(v.dailyRate / 24, 1));
    set('rate-daily', n(v.dailyRate, 0));
    set('tower-pending', n(s.tower.pending, 4) + ' COIN');
    const live = document.getElementById('live-mining');
    if (live) live.innerHTML = '+' + n(v.pending, 4) + ' <small>COIN</small>';
    const claim = root.querySelector('[data-action="claim-mining"]');
    if (claim) claim.disabled = v.pending < 1;
    const towerClaim = root.querySelector('[data-action="claim-tower"]');
    if (towerClaim) towerClaim.disabled = s.tower.pending < 0.0001;
    if (route === 'market' && ui.marketTab !== 'history') {
      const amount = Number(document.getElementById('trade-amount')?.value);
      if (isFinite(amount)) {
        const receive = Math.max(0, amount / D.marketPrice * (1 - D.slippage) - D.serviceFee / D.marketPrice);
        set('trade-receive', n(receive, 0));
        set('trade-total', n(amount + D.serviceFee, 3) + ' TON');
      }
    }
    if (route === 'staking') {
      const amount = Number(document.getElementById('stake-amount')?.value) || 0;
      const plan = D.stakingPlans.find((p) => p.days === ui.plan) || D.stakingPlans[0];
      set('stake-reward', '+' + n(amount * plan.percent / 100, 2) + ' COIN');
      set('stake-total', n(amount * (1 + plan.percent / 100), 2) + ' COIN');
    }
    if (route === 'withdraw') {
      const gross = Number(document.getElementById('withdraw-amount')?.value) || 0;
      set('hold-requirement', n(gross * D.withdrawHoldPct, 2) + ' COIN');
      const req = document.getElementById('withdraw-current-hold');
      if (req) req.textContent = n(s.wallet.hold, 2) + ' COIN';
    }
  }

  /* ---------- actions ---------- */
  async function act(fn, after) {
    setBusy(true);
    const beforeLevel = E.state()?.mining.level;
    try {
      const r = await fn();
      if (!r.ok) { toast(t(r.error), true); return null; }
      haptic('success');
      if (after) after(r.data);
      const current = E.state();
      if (current && beforeLevel && current.mining.level > beforeLevel) levelUp(current.mining.level);
      render();
      return r.data;
    } catch (e) { toast(t('err_request_failed'), true); console.error(e); return null; }
    finally { setBusy(false); }
  }
  function confirmModal(action) {
    if (!modalConfirm) return;
    const fn = modalConfirm;
    closeModal();
    Promise.resolve(fn()).then((r) => {
      if (r && r.ok === false) toast(t(r.error), true);
      else { toast(t('success')); render(); }
    });
  }

  async function handle(action, el) {
    const [name, a, b, c] = action.split(':');
    if (name === 'nav') return go(a);
    if (name === 'back') return back();
    if (name === 'close') return closeModal();
    if (name === 'confirm-modal') return confirmModal();
    if (name === 'prompt-confirm') {
      const value = document.getElementById('prompt-input')?.value ?? null;
      const resolve = promptResolve; promptResolve = null;
      closeModal();
      resolve?.(value);
      return;
    }
    if (name === 'noop') return;
    if (name === 'language') return modal(U.modals.language());
    if (name === 'choose-language') {
      const code = a;
      T.setLanguage(code);
      await act(() => E.actions.setLanguage(code));
      document.documentElement.lang = code;
      return;
    }
    if (name === 'notifications') {
      const spec = U.modals.notifications();
      modal(spec);
      await E.actions.notificationsRead();
      render();
      return;
    }
    if (name === 'claim-mining') return act(() => E.actions.claimMining(), (r) => toast('+' + n(r.claimed, 4) + ' COIN'));
    if (name === 'claim-tower') return act(() => E.actions.claimTower(), (r) => toast('+' + n(r.claimed, 4) + ' COIN'));
    if (name === 'claim-streak') return act(() => E.actions.claimStreak(), (r) => toast(t('dailyReward') + ' +' + n(r.reward, 0) + ' COIN'));
    if (name === 'claim-all-tasks') return act(() => E.actions.claimAllTasks(), (r) => toast('+' + n(r.reward, 0) + ' COIN · ' + r.count + ' ' + (T.lang === 'id' ? 'hadiah' : 'rewards')));
    if (name === 'station-tab') { ui.stationTab = a; return render(); }
    if (name === 'sector') { ui.sector = +a; return render(); }
    if (name === 'crate-filter') { ui.crateFilter = a; return render(); }
    if (name === 'crate-details') { ui.crateKey = a; return modal(U.modals.crateDetails(a)); }
    if (name === 'open-crate') return act(() => E.actions.openCrate(a), (r) => { closeModal(); modal(U.modals.crateResult(r.rewards)); });
    if (name === 'part-filter') { ui.partType = +a; return render(); }
    if (name === 'inventory-tier') { ui.tier = +a; return render(); }
    if (name === 'craft-type') { ui.craftType = +a; return render(); }
    if (name === 'craft') return act(() => E.actions.craft(+a, +b), () => toast(t('success')));
    if (name === 'part') return modal(U.modals.part(+a, +b));
    if (name === 'install') return act(() => E.actions.install(+a, +b));
    if (name === 'upgrade') return modal(U.modals.upgrade(+a));
    if (name === 'confirm-upgrade') return act(() => E.actions.upgrade(+a), () => closeModal());
    if (name === 'plan') { ui.plan = +a; return render(); }
    if (name === 'review-stake') {
      const amount = Number(document.getElementById('stake-amount')?.value);
      return modal(U.modals.reviewStake(ui.plan, amount));
    }
    if (name === 'confirm-stake') return act(() => E.actions.createStake(+a, +b), () => closeModal());
    if (name === 'claim-stake') return act(() => E.actions.claimStake(a), (r) => toast('+' + n(r.claimed, 2) + ' COIN'));
    if (name === 'task-tab') { ui.taskTab = a; return render(); }
    if (name === 'task-action') return handleTask(a, b);
    if (name === 'activity') { ui.activity = a; return render(); }
    if (name === 'export') {
      const rows = [['date', 'kind', 'amount', 'balance']].concat(E.state().ledger.map((x) => [new Date(x.created_ms).toISOString(), x.kind, x.amount, x.balance_after]));
      const csv = rows.map((r) => r.join(',')).join('\n');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      const link = document.createElement('a'); link.href = url; link.download = 'mario-history.csv'; link.click();
      URL.revokeObjectURL(url);
      return;
    }
    if (name === 'max') {
      const input = document.getElementById(a); if (!input) return;
      const s = E.state();
      input.value = a === 'stake-amount' ? Math.max(0, Math.min(s.mining.balance, s.staking.limit - s.staking.staked))
        : a === 'withdraw-amount' ? Math.min(s.mining.balance, s.withdrawal.limit || s.mining.balance)
          : Math.max(0, Math.floor(Math.min(1000, s.wallet.ton - 0.21) * 1e6) / 1e6);
      ui.tradeAmount = input.value; ui.withdrawAmount = input.value;
      return updateCalculations();
    }
    if (name === 'activity-detail') {
      const id = a.startsWith('swap-') ? a.slice(5) : a;
      const item = E.state().ledger.find((x) => x.id === id) || E.state().market.swaps.find((x) => x.id === id);
      if (!item) return;
      return modal({ title: 'recentActivity', html: U.summaryRow(t('amount'), n(item.amount ?? item.receive, 4) + ' COIN') + U.summaryRow(t('day'), T.fmtDate(item.created_ms || item.createdAt)) + U.summaryRow('Status', t('completed')) });
    }
    if (name === 'market-tab') { ui.marketTab = a === 'history' ? 'history' : 'buy'; return render(); }
    if (name === 'review-trade') {
      const amount = Number(document.getElementById('trade-amount')?.value);
      if (!isFinite(amount) || amount < 0.1 || amount > 1000) { toast(t('err_invalid_amount'), true); return; }
      if (!E.state().wallet.address) return act(() => E.actions.connectWallet(), () => toast(t('connected')));
      return modal({ title: 'reviewPurchase', html: U.summaryRow(t('youPay'), n(amount, 3) + ' TON') + U.summaryRow(t('youReceive'), '≈ ' + n(amount / D.marketPrice * (1 - D.slippage) - D.serviceFee / D.marketPrice, 0) + ' COIN') + U.summaryRow(t('serviceFee'), n(D.serviceFee, 3) + ' TON') + U.summaryRow(t('slippage'), '0.5%') + `<p class="muted small" style="margin-top:10px">${t('marketQuoteHint')}</p>`, confirm: 'confirm-trade:' + amount });
    }
    if (name === 'confirm-trade') return act(() => E.actions.marketTrade(+a), () => closeModal());
    if (name === 'connect') return act(() => E.actions.connectWallet(), () => toast(t('connected')));
    if (name === 'verify-wallet') return act(() => E.actions.verifyWallet());
    if (name === 'refresh-wallet') return act(() => E.actions.refreshWallet());
    if (name === 'deposit') {
      if (global.BACKEND?.remote) return act(() => E.actions.deposit());
      return modal({ title: 'deposit', html: `<p class="muted small">${t('depositMinimum')}</p><label class="form-label">${t('depositAmount')}</label>${U.amountInput('deposit-amount', '5000', 'COIN')}`, confirm: 'confirm-deposit' });
    }
    if (name === 'confirm-deposit') {
      const amount = Number(document.getElementById('deposit-amount')?.value);
      return act(() => E.actions.deposit(amount), () => { closeModal(); toast(t('transactionSubmitted')); });
    }
    if (name === 'check-payment') return act(() => E.actions.checkPayment(a));
    if (name === 'confirm-withdraw') return modal(U.modals.confirmWithdraw());
    if (name === 'confirm-withdraw-final') return act(() => E.actions.createWithdrawal(ui.withdrawAmount), () => closeModal());
    if (name === 'commission-history') return modal(U.modals.commission(a));
    if (name === 'copy-link') return copy(D.inviteLink(E.state().user.id));
    if (name === 'copy-address') return copy(E.state().wallet.address);
    if (name === 'invite') {
      const url = 'https://t.me/share/url?url=' + encodeURIComponent(D.inviteLink(E.state().user.id)) + '&text=' + encodeURIComponent(T.raw('friendsSub'));
      return openExternal(url);
    }
    if (name === 'send-ticket') {
      const subject = document.getElementById('subject')?.value, message = document.getElementById('message')?.value;
      return act(() => E.actions.sendTicket(subject, message), () => {
        const form = document.getElementById('support-form'); if (form) form.reset();
        toast(t('ticketSent'));
      });
    }
    if (name === 'bot-permission') {
      try {
        if (tg?.requestWriteAccess) { tg.requestWriteAccess((ok) => toast(t(ok ? 'botPermissionAllowed' : 'botPermissionPending'))); }
        else toast(t('botPermissionUnsupported'), true);
      } catch { toast(t('botPermissionUnsupported'), true); }
      return E.actions.setBotPermission(true);
    }
    if (name === 'dev') return act(() => E.actions.dev(a, b));
    if (name === 'find-level') {
      const value = Number(document.getElementById('level-search')?.value);
      if (!value || value < 1 || value > 500) return toast(t('err_invalid_amount'), true);
      return go(U.levelLink(value));
    }
    if (name === 'level-detail') return modal(U.modals.levelDetail(+a));
    if (name === 'admin-tab') { ui.adminTab = a; return render(); }
    if (name === 'admin-setup' || name === 'admin-login') {
      const pin = document.getElementById('admin-pin')?.value || '';
      const pin2 = document.getElementById('admin-pin2')?.value;
      if (pin2 !== undefined && pin !== pin2) return toast(t('raPinMismatch'), true);
      const initData = tg?.initData || (name === 'admin-setup' ? 'local-demo-init' : '');
      return act(() => name === 'admin-setup' ? E.actions.adminSetup(pin, initData) : E.actions.adminLogin(pin, initData));
    }
    if (name === 'admin-logout') return act(() => E.actions.adminLogout());
    if (name === 'admin-decision') {
      return modal({ title: 'raConfirmDecision', html: `<p class="muted">${t('raReviewNotice')}</p><label class="form-label">${t('raNote')}</label><input id="admin-note" type="text" placeholder="${t('raNoteHint')}">`, confirm: 'confirm-decision:' + a + ':' + b });
    }
    if (name === 'confirm-decision') return act(() => E.actions.adminDecision(a, b, document.getElementById('admin-note')?.value || ''), () => closeModal());
    if (name === 'admin-moderate') {
      return modal({ title: b === '1' ? 'raBlock' : 'raUnblock', html: `<p class="muted">${t('raReviewNotice')}</p><label class="form-label">${t('raNote')}</label><input id="admin-note" type="text">`, confirm: 'confirm-moderate:' + a + ':' + b });
    }
    if (name === 'confirm-moderate') return act(() => E.actions.adminModerate(a, b === '1', document.getElementById('admin-note')?.value || ''), () => closeModal());
    if (name === 'admin-mark-paid') {
      return modal({ title: 'withdrawals', html: `<p class="muted small">${t('raReviewNotice')}</p><label class="form-label">TX hash (on-chain)</label><input id="admin-tx" type="text" placeholder="64 hex karakter">`, confirm: 'confirm-mark-paid:' + a });
    }
    if (name === 'confirm-mark-paid') {
      const hash = document.getElementById('admin-tx')?.value || '';
      return act(async () => {
        const r = await BACKEND.api('/api/withdrawal/mark-paid', { id: a, txHash: hash });
        if (r.state) E.setState(r.state);
        return { ok: true, data: r };
      }, () => closeModal());
    }
    if (name === 'admin-search') { toast(t('search') + ': ' + (document.getElementById('admin-search')?.value || '')); return; }
    if (name === 'am') return handleAmbassador(a);
    if (name.startsWith('rt:')) return;
  }

  async function handleTask(id, verb) {
    const m = D.missions.find((x) => x.id === id);
    if (!m) return;
    const s = E.state(), ms = s.tasks.mission[id] || {};
    if (verb === 'check') return modal(U.modals.taskDetail(id));
    if (verb === 'start') {
      const r = await act(() => E.actions.mission(id, 'start'), (data) => { if (data.url) openExternal(data.url); });
      if (r?.url) {
        modal({ title: m.title, html: `<p class="muted">${t(m.desc)}</p><p class="gold small">${t('missionAttestation')}</p>`, confirmLabel: t('missionConfirm'), confirm: 'task-confirm:' + id });
      }
      return;
    }
    if (verb === 'claim') return act(() => E.actions.mission(id, 'claim'), (r) => toast('+' + n(r.reward, 0) + ' COIN'));
  }
  async function handleAmbassador(verb) {
    const channel = document.getElementById('amb-channel')?.value || '';
    if (verb === 'check') return act(() => E.actions.ambassadorCheck(channel));
    if (verb === 'apply') return act(() => E.actions.ambassadorApply(''), () => toast(t('applicationPending')));
  }

  /* ---------- events ---------- */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el || el.disabled) return;
    const action = el.dataset.action;
    if (action.startsWith('task-confirm:')) {
      const id = action.split(':')[1];
      closeModal();
      return act(() => E.actions.mission(id, 'confirm'), () => modal({ title: mTitle(id), html: `<p class="muted">${t('missionAttestation')}</p>`, confirmLabel: t('claimReward'), confirm: 'task-claim:' + id }));
    }
    if (action.startsWith('task-claim:')) {
      const id = action.split(':')[1];
      return act(() => E.actions.mission(id, 'claim'), (r) => { closeModal(); toast('+' + n(r.reward, 0) + ' COIN'); });
    }
    handle(action, el);
  });
  function mTitle(id) { return D.missions.find((x) => x.id === id)?.title || 'tasks'; }
  document.addEventListener('input', (e) => {
    const id = e.target.id;
    if (id === 'trade-amount') ui.tradeAmount = e.target.value;
    if (id === 'withdraw-amount') ui.withdrawAmount = e.target.value;
    if (id === 'stake-amount' || id === 'trade-amount' || id === 'withdraw-amount') updateCalculations();
  });
  document.addEventListener('change', (e) => {
    if (e.target.id === 'withdraw-amount') updateCalculations();
  });
  document.addEventListener('submit', (e) => {
    if (e.target.id === 'support-form') { e.preventDefault(); handle('send-ticket'); }
    if (e.target.id === 'trade-form') { e.preventDefault(); handle('review-trade'); }
    if (e.target.id === 'level-search-form') { e.preventDefault(); handle('find-level'); }
  });
  addEventListener('hashchange', () => {
    const p = parseHash(); route = p.route; query = p.query; render();
  });
  tg?.BackButton?.onClick?.(() => back());

  /* ---------- boot ---------- */
  function launchPage() {
    root.innerHTML = `<main class="launch-page"><section class="launch-card"><img class="launch-logo" src="${U.asset('logo')}" alt=""><span class="launch-eyebrow">TELEGRAM MINI APP</span><h1>Mario Bros: Coin Quest</h1><p class="muted">${t('loginRequired')}</p><a class="btn btn-primary wide" href="https://t.me/${D.botName}?startapp=app"><span>${t('openTelegram')}</span></a><small class="muted">@${D.botName}</small></section></main>`;
  }

  async function boot() {
    try {
      tg?.ready?.(); tg?.expand?.();
      tg?.setHeaderColor?.('#050b17'); tg?.setBackgroundColor?.('#050b17');
    } catch {}
    let tgUser = tg?.initData ? E.parseInitData(tg.initData) : null;
    if (new URLSearchParams(location.search).get('live') === '1' && !tg?.initData) { launchPage(); return; }

    const server = await fetch('/app-config.json').then((r) => r.ok ? r.json() : null).catch(() => null);
    if (server && global.BACKEND) {
      try {
        const auth = await BACKEND.boot(tg?.initData);
        tgUser = BACKEND.user || tgUser;
        if (auth.state?.admin) auth.state.admin.isAdmin = !!auth.isAdmin;
        E.setState(auth.state);
      } catch (e) {
        console.warn('Backend authentication failed:', e);
        if (tg?.initData) { launchPage(); return; }
      }
    }

    E.load(tgUser);
    if (BACKEND.ready && BACKEND.state) E.setState(BACKEND.state);
    const s = E.state();
    if (s.prefs.language) T.setLanguage(s.prefs.language);
    else if (tgUser?.language_code) T.setLanguage(tgUser.language_code);
    document.documentElement.lang = T.lang;
    const p = parseHash(); route = p.route; query = p.query;
    render();
    if (!localStorage.getItem('mario_onboarded')) {
      localStorage.setItem('mario_onboarded', '1');
      setTimeout(() => modal({
        title: 'welcome',
        html: `<div class="center" style="margin-bottom:10px"><div class="coin-strip"><i>¥</i><i>¥</i><i>¥</i><i>¥</i><i>¥</i></div><h2>SELAMAT DATANG, PEMUDA!</h2></div>
          <p class="muted small">Tambang koin, bangun stasiun pipa, buka peti misteri, dan kumpulkan bintang bersama teman.</p>
          <div class="subpanel" style="margin-top:10px">
            <div class="summary"><span>Klaim tiap 12 jam</span><b>Dapat koin</b></div>
            <div class="summary"><span>Pasang 4 modul</span><b>Aktifkan lantai</b></div>
            <div class="summary"><span>Hubungkan dompet TON</span><b>Saldo on-chain</b></div>
            <div class="summary"><span>Misi harian</span><b>Bintang ekstra</b></div>
          </div><p class="muted tiny" style="margin-top:10px">Tekan CLAIM untuk memulai. Semangat!</p>`
      }), 800);
    }
    E.subscribe(() => { updateCalculations(); });

    const syncServer = async () => {
      if (!BACKEND.ready) return;
      const f = await BACKEND.api('/api/bootstrap', undefined, 'GET');
      if (f.state) {
        if (f.state.admin) f.state.admin.isAdmin = !!f.isAdmin;
        E.setState(f.state);
      }
      await BACKEND.refreshAdmin();
      if (E.state()) E.setState(E.state());
    };

    setInterval(() => {
      if (BACKEND.ready) syncServer().catch(() => {});
      else E.tick();
      updateCalculations();
    }, 5000);
    setInterval(() => { updateCalculations(); }, 1000);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) return;
      if (BACKEND.ready) syncServer().catch(() => {});
      else E.tick();
      updateCalculations();
    });
    global.addEventListener('mario:wallet', async (e) => {
      if (!BACKEND.ready || !e.detail?.account?.address) return;
      try {
        await BACKEND.api('/api/wallet/connect', { address: e.detail.account.address });
        await syncServer();
        render();
      } catch (err) { console.warn(err); }
    });
  }

  global.APP = { ui, go, back, render, modal, closeModal, promptModal, toast, act, handle, boot, route, query, busy };
  boot().catch((e) => { console.error(e); root.innerHTML = `<div class="full-error"><h1>Mario Bros: Coin Quest</h1><p class="muted">${e.message}</p></div>`; });
})(window);
