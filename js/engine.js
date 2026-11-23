/* Rifty Mining - local state engine. Mirrors the reference app's server-side operations
   with a fully offline, persistent simulation so every feature is usable. */
(function (global) {
  'use strict';
  const D = global.DATA;
  const DAY = 86400000;
  const HOUR = 3600000;
  const KEY = 'rifty_state_v2';
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const round = (v, d = 4) => Number(Number(v || 0).toFixed(d));

  function parseInitData(initData) {
    try {
      const params = new URLSearchParams(initData);
      const user = JSON.parse(params.get('user') || '{}');
      return { id: String(user.id || ''), first_name: user.first_name || 'Explorer',
        username: user.username || '', photo_url: user.photo_url || '',
        premium: !!user.is_premium, language_code: user.language_code || 'en' };
    } catch { return null; }
  }

  function defaultState(tgUser) {
    const now = Date.now();
    const user = tgUser || { id: '7641002831', first_name: 'Rift Explorer', username: 'riftexplorer',
      photo_url: '', premium: false, language_code: 'en' };
    const floors = Array.from({ length: D.maxFloors }, (_, i) => {
      const floor = i + 1;
      const sector = D.sectors.find((s) => floor >= s.from && floor <= s.to) || D.sectors[0];
      return { floor, tier: sector.tier, perSlot: sector.perSlot, slots: [0, 0, 0, 0],
        rank: 0, income: D.floorIncome(floor, sector.tier), active: false,
        locked: floor > 1, upgrade: D.upgradeQuote(floor, sector.tier, 0) };
    });
    const refs = [
      { id: '778812003', name: 'Nova', level: 2, active: true, hold: 500, earned: 0 },
      { id: '552100987', name: 'Pulse', level: 1, active: false, hold: 20, earned: 0 },
      { id: '991245377', name: 'Prism', level: 3, active: true, hold: 2200, earned: 0 }
    ];
    const s = {
      v: 2, timeOffset: 0,
      user: { id: user.id, name: user.first_name, username: user.username,
        photoUrl: user.photo_url, premium: !!user.premium, joinedAt: now - 21 * DAY,
        language: user.language_code || 'en' },
      mining: { balance: 12480.5321, pending: 0, lastClaim: now, pausesAt: now + 12 * HOUR,
        boostUntil: 0, multiplier: 1, level: 1, league: 'bronze',
        daily: D.levelDaily(1), baseDaily: D.baseDaily },
      wallet: { address: '', rawAddress: '', ton: 0, hold: 0, verified: false,
        holdFresh: true, ageDays: 45, dexTrades: 0, lastRefresh: now },
      tower: { pending: 0, lastClaim: now, rate: 0, floors,
        inventory: [{ type: 1, tier: 0, count: 6 }, { type: 2, tier: 0, count: 4 },
          { type: 3, tier: 0, count: 5 }, { type: 4, tier: 0, count: 3 }],
        daily: { upgrades: 0, date: new Date(now).toISOString().slice(0, 10) } },
      friends: { refs, percent: 5, earned: 842.19, lastCredit: now - 2 * HOUR,
        upline: new URLSearchParams(location.search).get('ref') || (location.hash.match(/ref_(\d+)/) || [])[1] || '' },
      staking: { staked: 0, limit: 50000, stakes: [], totalContrib: 0 },
      tasks: { streak: { day: 4, last: now - 20 * HOUR }, mission: {}, started: {} },
      withdrawal: { items: [], lastRequest: 0 },
      market: { swaps: [], price: D.marketPrice, quoteAt: 0 },
      notifications: [
        { id: uid(), key: 'welcome', at: now - 21 * DAY, read: false },
        { id: uid(), key: 'dailyReward', at: now - 3 * HOUR, read: false }
      ],
      support: [],
      ambassador: { verification: null, applications: [], tier: 0 },
      admin: { pin: '', authenticated: false, until: 0, attempts: 0, lockedUntil: 0,
        audit: [], restrictions: {}, selected: [] },
      ledger: [{ id: uid(), kind: 'opening_balance', amount: 12480.5321, balance_after: 12480.5321, created_ms: now - 21 * DAY }],
      payments: [], commissions: [
        { id: uid(), from: 'Nova', amount: 312.44, created_ms: now - 2 * HOUR }
      ],
      prefs: { language: '', notifications: true, botPermission: false }
    };
    return s;
  }

  let S = null;
  const listeners = new Set();
  const notify = () => listeners.forEach((fn) => fn(S));

  function load(tgUser) {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.v === 2) { S = parsed; migrate(); return S; }
      }
    } catch (e) { console.warn('state load failed', e); }
    S = defaultState(tgUser);
    save();
    return S;
  }
  function migrate() {
    S.notifications ||= []; S.support ||= []; S.commissions ||= [];
    S.admin ||= { pin: '', authenticated: false, until: 0, attempts: 0, lockedUntil: 0, audit: [], restrictions: {}, selected: [] };
    S.admin.restrictions ||= {}; S.admin.audit ||= [];
    S.tower.daily ||= { upgrades: 0, date: '' };
    reconcile();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { console.warn('save failed', e); } }
  const state = () => S;
  const now = () => Date.now() + (S ? S.timeOffset : 0);
  const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

  function reconcile() {
    if (!S) return;
    const n = now();
    // level from verified on-chain hold
    let level = 1;
    for (let i = D.levels.length - 1; i >= 0; i--) {
      if (S.wallet.hold >= D.levels[i].hold) { level = D.levels[i].level; break; }
    }
    S.mining.level = level;
    S.mining.league = D.leagueOf(level).key;
    S.mining.daily = D.levelDaily(level);
    S.mining.baseDaily = D.baseDaily;
    S.mining.next = D.levels[level] || null;
    // staking limit by league
    S.staking.limit = Math.min(1000000, 50000 * Math.max(1, Math.ceil(level / 20)));
    // tower rate
    S.tower.rate = S.tower.floors.filter((f) => f.active).reduce((sum, f) => sum + f.income * (1 + (f.rank - 1) * 0.15), 0);
    // accrual
    const elapsed = Math.max(0, Math.min(n, S.mining.pausesAt) - S.mining.lastClaim);
    const boosted = Math.max(0, Math.min(elapsed, S.mining.boostUntil - S.mining.lastClaim));
    const normal = S.mining.daily * S.mining.multiplier;
    S.mining.pending = round(elapsed > 0
      ? (normal * D.boostMultiplier * boosted + normal * (elapsed - boosted)) / DAY
      : 0, 6);
    const towerElapsed = Math.min(n - S.tower.lastClaim, 24 * HOUR);
    S.tower.pending = round((S.tower.rate / 24) * (towerElapsed / HOUR), 6);
    // daily counters
    const today = new Date(n).toISOString().slice(0, 10);
    if (S.tower.daily.date !== today) { S.tower.daily = { upgrades: 0, date: today }; }
    // matured stakes flag computed on render
    // admin session
    if (S.admin.authenticated && now() > S.admin.until) S.admin.authenticated = false;
  }

  function tick() {
    if (!S) return;
    reconcile();
    save();
  }

  function ledger(kind, amount, extra = {}) {
    S.ledger.unshift({ id: uid(), kind, amount: round(amount, 4),
      balance_after: round(S.mining.balance, 4), created_ms: now(), ...extra });
    if (S.ledger.length > 500) S.ledger.length = 500;
  }
  function pushNotification(key) {
    S.notifications.unshift({ id: uid(), key, at: now(), read: false });
    if (S.notifications.length > 60) S.notifications.length = 60;
  }
  const result = (data) => ({ ok: true, data });
  const fail = (error) => ({ ok: false, error: I18N.raw(error) || error });
  const needBalance = (amount) => S.mining.balance >= amount;

  function credit(amount, kind, meta) {
    S.mining.balance = round(S.mining.balance + amount, 4);
    ledger(kind, amount, meta);
  }
  function debit(amount, kind, meta) {
    S.mining.balance = round(S.mining.balance - amount, 4);
    ledger(kind, -amount, meta);
  }
  function addPart(type, tier, count = 1) {
    const found = S.tower.inventory.find((p) => p.type === +type && p.tier === +tier);
    if (found) found.count += count;
    else S.tower.inventory.push({ type: +type, tier: +tier, count });
  }
  function takePart(type, tier, count = 1) {
    const p = S.tower.inventory.find((x) => x.type === +type && x.tier === +tier);
    if (!p || p.count < count) return false;
    p.count -= count;
    return true;
  }
  function partCount(type, tier) {
    return S.tower.inventory.find((x) => x.type === +type && x.tier === +tier)?.count || 0;
  }

  function taskProgress(id) {
    switch (id) {
      case 'refs3': case 'refs20': case 'refs100':
        return S.friends.refs.filter((r) => r.active).length >= Number(id.slice(4));
      case 'stake': return S.staking.totalContrib >= 50000;
      case 'first_stake': return S.staking.stakes.length >= 1;
      case 'tower': return S.tower.floors.some((f) => f.active);
      case 'level': return S.mining.level >= 2;
      case 'hold': return S.wallet.hold >= 116;
      case 'mining_daily': return S.mining.lastClaim > now() - DAY;
      case 'workshop_daily': return S.ledger.some((x) => ['synthesis', 'floor_upgrade'].includes(x.kind) && x.created_ms > now() - DAY);
      default: return true;
    }
  }
  function missionAvailable(id) {
    const m = D.missions.find((x) => x.id === id);
    if (!m) return false;
    const st = S.tasks.mission[id] || {};
    if (m.once && st.claimed) return false;
    if (st.lastClaimed && m.cooldown && now() - st.lastClaimed < m.cooldown * HOUR) return false;
    return taskProgress(id);
  }
  function checkAutoTasks() {
    D.missions.filter((m) => m.kind === 'auto' && missionAvailable(m.id)).forEach((m) => {
      S.tasks.mission[m.id] ||= {};
      S.tasks.mission[m.id].ready = true;
    });
  }

  function creditReferrals(amount) {
    if (!S.friends.upline) return;
    const commission = round(amount * S.friends.percent / 100, 4);
    if (commission <= 0) return;
    credit(commission, 'referral_reward', { from: S.friends.upline });
    S.friends.earned = round(S.friends.earned + commission, 4);
    S.commissions.unshift({ id: uid(), from: 'Upline', amount: commission, created_ms: now() });
    pushNotification('referralReward');
  }

  const actions = {
    claimMining() {
      reconcile();
      if (S.mining.pending < 1) return fail('err_nothing_to_claim');
      const claimed = S.mining.pending;
      credit(claimed, 'mining_claim');
      S.mining.pending = 0;
      S.mining.lastClaim = now();
      S.mining.pausesAt = now() + D.miningPauseHours * HOUR;
      S.mining.boostUntil = now() + D.boostHours * HOUR;
      creditReferrals(claimed);
      S.tasks.mission.mining_daily ||= {};
      S.tasks.mission.mining_daily.ready = true;
      checkAutoTasks();
      save(); notify();
      return result({ claimed });
    },
    claimTower() {
      reconcile();
      if (S.tower.pending < 0.0001) return fail('err_nothing_to_claim');
      const claimed = S.tower.pending;
      credit(claimed, 'tower_claim');
      S.tower.pending = 0;
      S.tower.lastClaim = now();
      S.tasks.mission.tower ||= {}; S.tasks.mission.tower.ready = true;
      save(); notify();
      return result({ claimed });
    },
    openCrate(kind) {
      const c = D.crates[kind];
      if (!c) return fail('err_invalid_parameters');
      const daily = S.ledger.filter((x) => x.kind === 'crate_purchase' && x.metaKind === kind && x.created_ms > now() - DAY).length;
      if (daily >= c.limit) return fail('err_crate_daily_limit');
      if (!needBalance(c.price)) return fail('crateShortfall');
      debit(c.price, 'crate_purchase', { metaKind: kind, crate: kind });
      const rewards = [];
      for (let i = 0; i < c.count; i++) {
        let roll = Math.random() * 100, acc = 0, tier = 0;
        for (let t = 0; t < c.odds.length; t++) { acc += c.odds[t]; if (roll <= acc) { tier = t; break; } }
        rewards.push({ type: c.onlyType || (1 + Math.floor(Math.random() * 4)), tier });
      }
      if (c.guaranteed && !rewards.some((r) => r.tier >= c.guaranteed)) {
        const best = rewards.reduce((a, b) => (b.tier > a.tier ? b : a), rewards[0]);
        best.tier = c.guaranteed;
      }
      rewards.forEach((r) => addPart(r.type, r.tier));
      save(); notify();
      return result({ rewards, crate: kind });
    },
    craft(type, tier) {
      if (tier >= 4) return fail('err_invalid_parameters');
      if (partCount(type, tier) < 3) return fail('err_missing_components');
      const fee = round((D.crates.small.price / 3) * (tier + 1) * D.synthesisFee, 2);
      if (!needBalance(fee)) return fail('err_insufficient_balance');
      takePart(type, tier, 3);
      debit(fee, 'synthesis', { fee });
      addPart(type, tier + 1);
      S.tasks.mission.workshop_daily ||= {}; S.tasks.mission.workshop_daily.ready = true;
      save(); notify();
      return result({ type, tier: tier + 1, fee });
    },
    install(floorNo, type) {
      const f = S.tower.floors[+floorNo - 1];
      if (!f || f.locked) return fail('err_floor_locked');
      if (f.slots[+type - 1] >= f.perSlot) return fail('err_slot_complete');
      if (!takePart(type, f.tier)) return fail('err_missing_components');
      f.slots[+type - 1] += 1;
      if (f.slots.every((x) => x >= f.perSlot) && !f.active) {
        f.active = true; f.rank = 1;
        const nextFloor = S.tower.floors[f.floor];
        if (nextFloor) nextFloor.locked = false;
        S.tasks.mission.tower ||= {}; S.tasks.mission.tower.ready = true;
        pushNotification('task_tower');
      }
      reconcile(); save(); notify();
      return result({ floor: f.floor, slots: f.slots, active: f.active });
    },
    upgrade(floorNo) {
      const f = S.tower.floors[+floorNo - 1];
      if (!f || !f.active || f.rank >= 5) return fail('err_max_rank');
      const q = D.upgradeQuote(f.floor, f.tier, f.rank - 1);
      if (!q) return fail('err_max_rank');
      if (S.tower.daily.upgrades >= q.dailyLimit) return fail('err_upgrade_daily_limit');
      if (!needBalance(q.cost)) return fail('err_insufficient_balance');
      for (let type = 1; type <= 4; type++) if (partCount(type, q.tier) < q.perType) return fail('err_missing_components');
      for (let type = 1; type <= 4; type++) takePart(type, q.tier, q.perType);
      debit(q.cost, 'floor_upgrade', { floor: f.floor });
      f.rank += 1;
      f.income = D.floorIncome(f.floor, Math.min(4, f.tier + (f.rank >= 5 ? 1 : 0)));
      f.upgrade = D.upgradeQuote(f.floor, f.tier, f.rank - 1);
      S.tower.daily.upgrades += 1;
      S.tasks.mission.workshop_daily ||= {}; S.tasks.mission.workshop_daily.ready = true;
      reconcile(); save(); notify();
      return result({ floor: f.floor, rank: f.rank });
    },
    createStake(days, amount) {
      const plan = D.stakingPlans.find((p) => p.days === +days);
      const amt = Number(amount);
      if (!plan || !isFinite(amt) || amt < 100) return fail('err_invalid_amount');
      if (S.staking.stakes.length >= 100) return fail('err_too_many_stakes');
      if (S.staking.staked + amt > S.staking.limit) return fail('err_staking_limit');
      if (!needBalance(amt)) return fail('err_insufficient_balance');
      debit(amt, 'stake_locked');
      const reward = round(amt * plan.percent / 100, 4);
      S.staking.stakes.unshift({ id: uid(), amount: amt, days: plan.days, percent: plan.percent,
        reward, createdAt: now(), endsAt: now() + plan.days * DAY, claimed: false });
      S.staking.staked = round(S.staking.staked + amt, 4);
      S.staking.totalContrib = round(S.staking.totalContrib + amt, 4);
      S.tasks.mission.first_stake ||= {}; S.tasks.mission.first_stake.ready = true;
      save(); notify();
      return result({ id: S.staking.stakes[0].id });
    },
    claimStake(id) {
      const st = S.staking.stakes.find((x) => x.id === id);
      if (!st || st.claimed) return fail('err_stake_locked');
      if (st.endsAt > now()) return fail('err_stake_locked');
      st.claimed = true;
      S.staking.staked = round(Math.max(0, S.staking.staked - st.amount), 4);
      const total = round(st.amount + st.reward, 4);
      credit(total, 'stake_matured');
      save(); notify();
      return result({ claimed: total });
    },
    claimAllTasks() {
      let total = 0, count = 0;
      for (const m of D.missions) {
        if (!missionAvailable(m.id)) continue;
        const r = actions.mission(m.id, 'claim');
        if (r.ok) { total += r.data.reward; count += 1; }
      }
      return count ? result({ reward: round(total, 2), count }) : fail('err_nothing_to_claim');
    },
    claimStreak() {
      const st = S.tasks.streak;
      if (st.day >= D.streakDays) return fail('err_streak_completed');
      if (now() - st.last < DAY) return fail('err_already_claimed_today');
      if (now() - st.last > 48 * HOUR) st.day = 0;
      st.day += 1; st.last = now();
      const reward = Math.round(300 + st.day * 120);
      credit(reward, 'daily_reward');
      save(); notify();
      return result({ day: st.day, reward });
    },
    mission(id, verb) {
      const m = D.missions.find((x) => x.id === id);
      if (!m) return fail('err_invalid_parameters');
      const st = S.tasks.mission[id] || (S.tasks.mission[id] = {});
      if (verb === 'start') {
        if (m.url) { st.started = now(); st.attempt = uid(); }
        return result({ url: m.url, attemptId: st.attempt });
      }
      if (verb === 'verify' || verb === 'confirm') {
        if (!st.started || now() - st.started < 5000) return fail('err_task_confirmation_wait');
        if (now() - st.started > 30 * 60000) return fail('err_task_confirmation_expired');
        st.confirmed = now();
        return result({ confirmed: true });
      }
      if (verb === 'claim') {
        if (!missionAvailable(id)) return fail(m.once && st.claimed ? 'err_task_already_claimed' : 'err_task_incomplete');
        if (st.lastClaimed && m.cooldown && now() - st.lastClaimed < m.cooldown * HOUR) return fail('err_task_confirmation_wait');
        st.lastClaimed = now();
        if (m.once) st.claimed = true;
        st.ready = false; st.started = 0; st.confirmed = 0;
        credit(m.reward, 'task_reward', { task: id });
        pushNotification(m.title);
        save(); notify();
        return result({ reward: m.reward });
      }
      return fail('err_invalid_parameters');
    },
    connectWallet(address) {
      const addr = address || ('UQ' + Math.random().toString(36).slice(2, 12) + 'RIFT');
      S.wallet.address = addr;
      S.wallet.rawAddress = addr;
      S.wallet.ton = round(12 + Math.random() * 20, 4);
      S.wallet.hold = round(240 + Math.random() * 900, 4);
      S.wallet.holdFresh = true;
      S.wallet.lastRefresh = now();
      reconcile(); save(); notify();
      return result({ address: addr });
    },
    disconnectWallet() {
      S.wallet.address = ''; S.wallet.rawAddress = ''; S.wallet.ton = 0;
      S.wallet.hold = 0; S.wallet.verified = false;
      reconcile(); save(); notify();
      return result({});
    },
    refreshWallet() {
      if (!S.wallet.address) return fail('err_connect_wallet');
      S.wallet.hold = round(Math.max(0, S.wallet.hold + (Math.random() - 0.4) * 50), 4);
      S.wallet.holdFresh = true;
      S.wallet.lastRefresh = now();
      reconcile(); save(); notify();
      return result({ hold: S.wallet.hold });
    },
    verifyWallet() {
      if (!S.wallet.address) return fail('err_connect_wallet');
      if (S.wallet.verified) return fail('err_wallet_already_verified');
      if (S.wallet.ton < 0.05) return fail('err_insufficient_ton');
      S.wallet.ton = round(S.wallet.ton - 0.05, 4);
      S.wallet.verified = true;
      save(); notify();
      return result({});
    },
    deposit(amount) {
      const amt = Number(amount);
      if (!isFinite(amt) || amt < 5000) return fail('err_invalid_amount');
      if (!S.wallet.address) return fail('err_connect_wallet');
      const p = { id: uid(), kind: 'deposit', amount: amt, createdAt: now(), status: 'pending', canCheck: true };
      S.payments.unshift(p);
      save(); notify();
      return result({ payment: p });
    },
    checkPayment(id) {
      const p = S.payments.find((x) => x.id === id);
      if (!p) return fail('err_payment_expired');
      if (now() - p.createdAt > 24 * HOUR) { p.status = 'expired'; save(); return fail('err_payment_expired'); }
      p.status = 'paid'; p.canCheck = false;
      if (p.kind === 'deposit') credit(p.amount, 'chain_deposit');
      else S.wallet.verified = true;
      save(); notify();
      return result({ payment: p });
    },
    createWithdrawal(amount) {
      const gross = Number(amount);
      if (!isFinite(gross) || gross < D.withdrawMinimum) return fail('err_invalid_amount');
      if (!S.wallet.address) return fail('err_connect_wallet');
      if (!S.wallet.verified) return fail('err_wallet_verification_required');
      if (!(S.wallet.ageDays >= 30 || S.wallet.dexTrades >= 1 || S.wallet.premium)) return fail('err_wallet_age_required');
      if (!S.wallet.holdFresh) return fail('err_hold_refresh_required');
      if (S.withdrawal.items.some((w) => w.status === 'pending' || w.status === 'approved')) return fail('err_withdrawal_pending');
      if (now() - S.withdrawal.lastRequest < D.withdrawCooldownHours * HOUR) return fail('err_withdrawal_cooldown');
      if (!needBalance(gross)) return fail('err_insufficient_balance');
      const requiredHold = round(gross * D.withdrawHoldPct, 2);
      if (S.wallet.hold + 0.0001 < requiredHold) return fail('err_hold_required');
      const fee = round(gross * D.withdrawFee, 4);
      debit(gross, 'withdrawal_reserved', { gross, fee });
      const item = { id: uid(), amount: gross, gross, fee, net: round(gross - fee, 4),
        address: S.wallet.address, userId: S.user.id, name: S.user.name,
        status: 'pending', createdAt: now(), requiredHold, risk: Math.floor(Math.random() * 30), hold: requiredHold };
      S.withdrawal.items.unshift(item);
      S.withdrawal.lastRequest = now();
      save(); notify();
      return result({ withdrawal: item });
    },
    marketTrade(amount) {
      const amt = Number(amount);
      if (!isFinite(amt) || amt < 0.1 || amt > 1000) return fail('err_invalid_amount');
      if (!S.wallet.address) return fail('err_connect_wallet');
      if (S.wallet.ton < amt + D.serviceFee + 0.15) return fail('err_insufficient_ton');
      const receive = round(amt / D.marketPrice * (1 - D.slippage) - D.serviceFee / D.marketPrice, 4);
      S.wallet.ton = round(S.wallet.ton - amt - D.serviceFee, 4);
      S.wallet.hold = round(S.wallet.hold + receive, 4);
      const swap = { id: uid(), side: 'buy', offer: amt, receive, status: 'completed', created_ms: now(), expires_ms: now() + HOUR };
      S.market.swaps.unshift(swap);
      reconcile(); save(); notify();
      return result({ swap });
    },
    sendTicket(subject, message) {
      if (!subject || String(message).length < 10) return fail('err_invalid_ticket');
      const ticket = { id: uid(), subject, message, status: 'open', createdAt: now(), replies: [] };
      S.support.unshift(ticket);
      save(); notify();
      return result({ ticket });
    },
    replyTicket(id, reply) {
      const t = S.support.find((x) => x.id === id);
      if (!t) return fail('err_invalid_ticket');
      t.replies.push({ text: reply, at: now() });
      t.status = 'open';
      save(); notify();
      return result({});
    },
    ambassadorCheck(channel) {
      if (!channel || channel.length < 3) return fail('err_invalid_channel');
      const members = 300 + Math.floor(Math.random() * 2500);
      S.ambassador.verification = { channel, members, at: now(), admin: true };
      save(); notify();
      return result({ members, admin: true });
    },
    ambassadorApply(note) {
      const a = S.ambassador;
      if (!a.verification || now() - a.verification.at > 30 * 60000) return fail('err_ambassador_verification_expired');
      const refs = S.friends.refs.filter((r) => r.active).length;
      const tier = D.ambassadorTiers.filter((x) => refs >= x.refs && a.verification.members >= x.subs).pop();
      if (!tier) return fail('err_ambassador_requirements');
      if (a.applications.some((x) => x.status === 'pending')) return fail('err_application_pending');
      a.applications.unshift({ id: uid(), channel: a.verification.channel, subs: a.verification.members,
        tier: tier.percent, note, status: 'pending', createdAt: now() });
      save(); notify();
      return result({ status: 'pending' });
    },
    setLanguage(lang) {
      S.prefs.language = lang;
      S.user.language = lang;
      save();
      return result({ language: lang });
    },
    notificationsRead() {
      S.notifications.forEach((x) => { x.read = true; });
      save(); notify();
      return result({});
    },
    setBotPermission(v) { S.prefs.botPermission = !!v; save(); return result({}); },
    // Sandbox tools from Settings
    dev(action, value) {
      switch (action) {
        case 'wallet': return actions.connectWallet();
        case 'credit': credit(Number(value) || 10000, 'sandbox_credit'); break;
        case 'hold':
          S.wallet.hold = Number(value) || 2500; S.wallet.holdFresh = true;
          S.wallet.address ||= 'UQDEMO1234567890RIFT'; reconcile(); break;
        case 'parts':
          [1, 2, 3, 4].forEach((tp) => addPart(tp, 0, 10)); break;
        case 'advance': S.timeOffset += (Number(value) || 1) * DAY; reconcile(); break;
        case 'referrals':
          for (let i = 0; i < 100; i++) S.friends.refs.push({ id: uid(), name: 'Explorer' + i,
            level: 2, active: true, hold: 200, earned: 0 });
          break;
        case 'process':
          S.withdrawal.items.forEach((w) => { if (w.status === 'approved') w.status = 'paid'; });
          break;
        case 'trade': return actions.marketTrade(1);
      }
      save(); notify();
      return result({});
    },
    // Admin panel
    adminSetup(pin, initData) {
      if (!/^\d{4,12}$/.test(pin)) return fail('err_admin_pin_format');
      if (!initData) return fail('err_admin_reopen_required');
      S.admin.pin = pin; S.admin.authenticated = true; S.admin.until = now() + 30 * 60000;
      save(); notify(); return result({});
    },
    adminLogin(pin, initData) {
      if (!initData) return fail('err_admin_reopen_required');
      if (S.admin.lockedUntil > now()) return fail('err_admin_locked');
      if (!/^\d{4,12}$/.test(pin)) return fail('err_admin_pin_format');
      if (pin !== S.admin.pin) {
        S.admin.attempts += 1;
        if (S.admin.attempts >= 3) { S.admin.lockedUntil = now() + 15 * 60000; S.admin.attempts = 0; }
        save(); return fail('err_admin_pin_invalid');
      }
      S.admin.attempts = 0; S.admin.authenticated = true; S.admin.until = now() + 30 * 60000;
      save(); notify(); return result({});
    },
    adminLogout() {
      S.admin.authenticated = false; save(); notify(); return result({});
    },
    adminDecision(id, decision, note) {
      if (!S.admin.authenticated && !global.__SERVER_ADMIN__) return fail('err_admin_session_required');
      if (note && note.length < 8) return fail('raNoteHint');
      const w = S.withdrawal.items.find((x) => x.id === id);
      if (!w) return fail('err_request_failed');
      w.status = decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected'
        : decision === 'hold' ? 'held' : decision === 'review' ? 'review' : w.status;
      if (decision === 'reject') credit(w.amount, 'withdrawal_refund');
      if (decision === 'approve') w.status = 'paid'; // local payout simulation
      S.admin.audit.unshift({ id: uid(), withdrawalId: id, decision, note, at: now(), admin: S.user.id });
      save(); notify(); return result({});
    },
    adminModerate(userId, restricted, note) {
      if (!S.admin.authenticated && !global.__SERVER_ADMIN__) return fail('err_admin_session_required');
      S.admin.restrictions[userId] = { restricted, note, at: now() };
      S.withdrawal.items.filter((w) => w.userId === userId).forEach((w) => {
        if (restricted) w.status = 'restricted';
      });
      S.admin.audit.unshift({ id: uid(), userId, decision: restricted ? 'restrict' : 'unrestrict', note, at: now() });
      save(); notify(); return result({});
    },
    adminTicket(id, reply) { return actions.replyTicket(id, reply); },
    adminRiskRefresh() { return result({}); },
    adminAmbassador(id, approve, tier) {
      if (!S.admin.authenticated && !global.__SERVER_ADMIN__) return fail('err_admin_session_required');
      const app = S.ambassador.applications.find((x) => x.id === id);
      if (!app) return fail('err_request_failed');
      app.status = approve ? 'approved' : 'rejected';
      if (approve) { S.ambassador.tier = tier; S.friends.percent = tier; }
      save(); notify(); return result({});
    },
    // ---- Real blockchain actions (called by the backend only) ----
    syncChain(wallet) {
      if (!wallet || !wallet.address) return fail('err_connect_wallet');
      S.wallet.address = wallet.address;
      S.wallet.rawAddress = wallet.rawAddress || wallet.address;
      if (wallet.ton !== undefined) S.wallet.ton = round(wallet.ton, 4);
      if (wallet.hold !== undefined) S.wallet.hold = round(wallet.hold, 4);
      if (wallet.verified !== undefined) S.wallet.verified = !!wallet.verified;
      S.wallet.holdFresh = true;
      S.wallet.lastRefresh = now();
      S.wallet.ageDays = Math.max(S.wallet.ageDays || 0, 30);
      reconcile(); save(); notify();
      return result({ address: S.wallet.address, ton: S.wallet.ton, hold: S.wallet.hold });
    },
    verifyChainWallet(txHash) {
      if (!S.wallet.address) return fail('err_connect_wallet');
      S.wallet.verified = true;
      S.wallet.dexTrades = Math.max(S.wallet.dexTrades || 0, 1);
      S.payments.unshift({ id: uid(), kind: 'verification', amount: 0.05, createdAt: now(), status: 'paid', canCheck: false, txHash });
      save(); notify();
      return result({ verified: true, txHash });
    },
    chainDeposit(amount) {
      const amt = round(Number(amount) || 0, 4);
      if (amt <= 0) return fail('err_invalid_amount');
      credit(amt, 'chain_deposit');
      S.payments.unshift({ id: uid(), kind: 'deposit', amount: amt, createdAt: now(), status: 'paid', canCheck: false });
      save(); notify();
      return result({ amount: amt });
    },
    adminMarkPaid(id, txHash) {
      const w = S.withdrawal.items.find((x) => x.id === id);
      if (!w) return fail('err_request_failed');
      w.status = 'paid'; w.txHash = txHash; w.paidAt = now();
      S.admin.audit.unshift({ id: uid(), withdrawalId: id, decision: 'paid', note: txHash, at: now() });
      save(); notify();
      return result({ withdrawal: w });
    }
  };

  const setState = (next) => {
    if (!next) return S;
    S = next;
    migrate();
    notify();
    return S;
  };

  global.ENGINE = { load, save, tick, state, now, subscribe, notify, actions, parseInitData,
    reconcile, setState, addPart, takePart, partCount, missionAvailable, taskProgress, result, fail,
    DAY, HOUR, uid };
})(window);
