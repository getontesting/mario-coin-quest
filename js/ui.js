/* Mario Bros: Coin Quest - view layer */
(function (global) {
  'use strict';
  const D = global.DATA, E = global.ENGINE, T = global.I18N;
  const t = T.t, n = T.num, raw = T.raw, esc = T.escapeHtml;
  const S = () => E.state();
  const A = (name) => "url('" + D.assetUrl(name) + "')";
  const asset = (name) => D.assetUrl(name);
  const now = () => E.now();

  const PATHS = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    box: '<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="M3 7v10l9 5 9-5V7M12 12v10"/>',
    station: '<path d="M3 21V9l6-4v16M9 21V3l6 4v14M15 21V8l6 3v10M2 21h20"/>',
    friends: '<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 11a3 3 0 0 0 0-6M17 14a5 5 0 0 1 4 5v1"/>',
    wallet: '<rect x="2" y="5" width="20" height="15" rx="3"/><path d="M2 9h20M16 14h3"/>',
    market: '<path d="M3 17 9 11l4 4 8-8M15 7h6v6"/>',
    layers: '<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>',
    gift: '<rect x="3" y="9" width="18" height="12" rx="2"/><path d="M12 9v12M3 13h18M12 9S9 3 6.5 5.5 12 9 12 9Zm0 0s3-6 5.5-3.5S12 9 12 9Z"/>',
    shield: '<path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3Z"/>',
    crown: '<path d="M3 7l4 4 5-7 5 7 4-4-2 12H5L3 7Z"/>',
    coins: '<ellipse cx="8" cy="7" rx="6" ry="3"/><path d="M2 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7M14 12c3.5.2 6 1.6 6 3.3V17c0 1.7-2.7 3-6 3s-6-1.3-6-3v-1"/>',
    bell: '<path d="M18 9a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8M10 21h4"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14 0 18M12 3c-3 3.5-3 14 0 18"/>',
    chevron: '<path d="m9 6 6 6-6 6"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    send: '<path d="m22 2-7 20-4-9-9-4 20-7Z"/>',
    copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
    download: '<path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16"/>',
    upload: '<path d="M12 21V9m0 0 4 4m-4-4-4 4M4 5h16"/>',
    swap: '<path d="M4 8h14m0 0-4-4m4 4-4 4M20 16H6m0 0 4-4m-4 4 4 4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="m4 12 5 5L20 6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
    refresh: '<path d="M20 7V3l-4 4M4 17v4l4-4M20 7a9 9 0 0 0-15-2M4 17a9 9 0 0 0 15 2"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    arrow: '<path d="M5 12h14m0 0-6-6m6 6-6 6"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    star: '<path d="m12 2 3 6.5 7 1-5 5 1.5 7L12 18l-6.5 3.5L7 14.5 2 9.5l7-1L12 2Z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    support: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>',
    spark: '<path d="M12 2v20M2 12h20M5 5l14 14M19 5 5 19"/>',
    fire: '<path d="M12 22c4 0 7-3 7-7 0-4-3-6-4-9-1 2-2 3-3 3 0-3-1-5-3-7-1 4-4 6-4 10 0 4 3 7 7 7Z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-7 8-7s8 3 8 7"/>',
    medal: '<circle cx="12" cy="14" r="6"/><path d="m8 3 2 5M16 3l-2 5M12 11l1 2 2 .3-1.5 1.5.4 2.2L12 15.8 10.1 17l.4-2.2L9 13.3l2-.3 1-2Z"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v5l4 2"/>',
    flag: '<path d="M5 21V4m0 0 12 2-3 4 3 4-12 2"/>',
    box2: '<path d="M4 8h16v12H4zM2 4h20v4H2zM9 12h6"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    funnel: '<path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z"/>'
  };
  const I = (name, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name] || PATHS.box}</svg>`;
  const B = (name, cls = '') => `<span class="iconbox ${cls}">${I(name)}</span>`;
  const btn = (label, action, o = {}) => `<button class="btn btn-${o.cls || 'primary'} ${o.extraClass || ''}" data-action="${esc(action)}" ${o.disabled ? 'disabled' : ''} ${o.extra || ''}>${o.icon ? I(o.icon) : ''}<span>${label}</span></button>`;
  const navBtn = (to, label, icon = '') => btn(t(label), 'nav:' + to, { cls: 'secondary', icon, extraClass: 'wide' });
  const progress = (value, max, cls = '') => `<div class="progress ${cls}"><i style="width:${Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0))}%"></i></div>`;
  const summaryRow = (label, value, total = false) => `<div class="summary ${total ? 'total' : ''}"><span class="muted">${label}</span><b>${value}</b></div>`;
  const empty = (key, icon = 'box') => `<div class="empty">${I(icon)}<span>${t(key)}</span></div>`;
  const artStyle = (name) => `style="--art:${A(name + '-hero')};background-image:${A(name + '-hero')}"`;
  const hero = (title, sub, artName = '', back = false) => `<section class="hero-art art-card" ${artStyle(artName || title)}>${back ? `<button class="btn btn-ghost" data-action="back" style="position:absolute;left:10px;top:10px;min-height:30px;padding:0 9px;z-index:2">${I('arrow')}</button>` : ''}<div><h1>${t(title)}</h1><p>${t(sub)}</p></div></section>`;
  const stats = (rows, three = false) => `<div class="stats ${three ? 'three' : ''}">${rows.map(([label, value, unit, icon, color]) => `<div class="stat"><div class="label"><span class="${color || ''}">${I(icon)}</span>${t(label)}</div><div class="value mono ${color || ''}">${value}</div><div class="unit">${unit}</div></div>`).join('')}</div>`;
  const chart = (production = false) => {
    const pts = production ? '0,104 20,100 40,96 60,90 80,87 100,82 120,76 140,70 160,63 180,58 200,52 220,46 240,39 260,32 280,25 300,18 320,10'
      : '0,110 10,104 20,108 30,95 40,101 50,90 60,96 70,87 80,90 90,80 100,90 110,73 120,80 130,75 140,63 150,70 160,58 170,65 180,51 190,60 200,43 210,49 220,33 230,44 240,28 250,35 260,20 270,31 280,18 290,25 300,12 310,17 320,5';
    return `<svg class="chart" viewBox="0 0 320 125" preserveAspectRatio="none" aria-label="${t(production ? 'production' : 'marketPrice')}"><defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#00d5ff" stop-opacity=".45"/><stop offset="1" stop-color="#6030ff" stop-opacity=".02"/></linearGradient></defs>${[20, 50, 80, 110].map((y) => `<path d="M0 ${y}H320" stroke="#25415e" stroke-dasharray="2 3" stroke-width=".5"/>`).join('')}<polygon points="0,125 ${pts} 320,125" fill="url(#cg)"/><polyline points="${pts}" fill="none" stroke="#36ddff" stroke-width="2"/></svg>`;
  };
  const medal = (league, size = 44) => `<img src="${asset('medal-' + league)}" alt="" width="${size}" height="${size}" loading="lazy">`;
  const partImg = (type) => `<img src="${asset(D.partImages[type])}" alt="" loading="lazy">`;
  const shortAddr = (a) => (a ? a.slice(0, 6) + '…' + a.slice(-4) : '—');
  const amountInput = (id, value, currency = 'COIN', max = true, min = 0) => `<div class="amount-input"><input id="${id}" type="number" inputmode="decimal" min="${min}" step="any" value="${esc(value)}">${max ? `<button data-action="max:${id}">MAX</button>` : ''}<b class="purple">${currency}</b></div>`;
  const sectionTitle = (label, extra = '') => `<div class="section-title"><h2>${I('spark')}${t(label)}</h2>${extra}</div>`;

  function header(route) {
    const s = S();
    const unread = s.notifications.some((x) => !x.read);
    const flag = { en: 'gb', uk: 'ua', ar: 'sa' }[T.lang] || T.lang;
    return `<div class="device-status"><span>9:41</span><div class="row" style="gap:6px">${I('spark')}</div></div>
      <div class="coin-strip" aria-hidden="true"><i>¥</i><i>¥</i><i>¥</i><i>¥</i><i>¥</i></div>
      <header class="topbar"><button class="brand" data-action="nav:home"><img src="${asset('logo')}" alt=""><b>Mario Bros</b></button>
      <div class="top-controls">
        <button class="top-control" data-action="language">${T.lang.toUpperCase()} <span class="chevron">⌄</span></button>
        <button class="top-control bell" data-action="notifications" aria-label="${t('notifications')}">${I('bell')}${unread ? '<span class="notification-dot"></span>' : ''}</button>
        <button class="top-control profile-pill ${route === 'profile' ? 'selected' : ''}" data-action="nav:profile">${s.user.photoUrl ? `<img src="${esc(s.user.photoUrl)}" alt="" width="30" height="30">` : `<span class="avatar" style="width:30px;height:30px;font-size:12px">${esc((s.user.name || '?')[0])}</span>`}<span><b>${t('profile')}</b><small>${t('level')} ${s.mining.level}</small></span></button>
      </div></header>`;
  }
  const NAV = [
    { key: 'home', icon: 'home', label: 'home' }, { key: 'mining', icon: 'bolt', label: 'mining' },
    { key: 'station', icon: 'station', label: 'station' }, { key: 'tasks', icon: 'gift', label: 'tasks' },
    { key: 'wallet', icon: 'wallet', label: 'wallet' }
  ];
  function bottomNav(route) {
    return `<nav class="bottom-nav">${NAV.map((x) => `<button class="nav-item ${route === x.key ? 'active' : ''}" data-action="nav:${x.key}">${I(x.icon)}<span>${t(x.label)}</span></button>`).join('')}</nav>`;
  }

  /* ---------- Home & Mining ---------- */
  function miningView() {
    const s = S(), m = s.mining, nowMs = now();
    const elapsed = Math.max(0, Math.min(nowMs, m.pausesAt) - m.lastClaim);
    const boosted = Math.max(0, Math.min(elapsed, m.boostUntil - m.lastClaim));
    const rate = m.daily * m.multiplier;
    const computed = (rate * D.boostMultiplier * boosted + rate * (elapsed - boosted)) / 86400000;
    return { paused: nowMs >= m.pausesAt, pending: computed, dailyRate: nowMs >= m.pausesAt ? 0 : nowMs < m.boostUntil ? rate * D.boostMultiplier : rate,
      remaining: Math.max(0, Math.ceil((m.pausesAt - nowMs) / 1000)), boosted };
  }
  function miningHero() {
    const v = miningView(), s = S();
    const time = [Math.floor(v.remaining / 3600), Math.floor(v.remaining / 60) % 60, v.remaining % 60].map((x) => String(x).padStart(2, '0')).join(':');
    return `<section class="panel glow art-card hero-mining" ${artStyle('mining')}><div class="row">${B('box', 'cyanbox')}<div><h2>${t('mining')}</h2><p class="${v.paused ? 'gold' : 'green'} small bold"><span class="running-dot"></span>${t(v.paused ? 'miningPaused' : 'running')}</p></div><span class="boost-pill">ϟ ×${n(s.mining.multiplier, 2)}</span></div>
      <div class="mining-number mono" id="live-mining">+${n(v.pending, 4)} <small>COIN</small></div>
      <p class="claim-meta">${I('clock')}<span id="mining-note">${v.paused ? t('miningClaimToResume') : t('miningPausesIn', { time })}</span></p>
      ${btn(t('claimRift'), 'claim-mining', { icon: 'bolt', disabled: v.pending < 1, extraClass: 'wide' })}</section>`;
  }
  function balanceCard() {
    return `<div class="panel balance-card link-card" data-action="nav:wallet" role="button" tabindex="0">${B('coins')}<div><p class="muted small">${t('appBalance')}</p><div class="amount mono">${n(S().mining.balance, 4)} <span class="unit">COIN</span></div></div>${I('chevron')}</div>`;
  }
  function levelCard() {
    const s = S(), next = s.mining.next;
    return `<div class="panel level-card link-card" data-action="nav:leagues" role="button" tabindex="0">${medal(s.mining.league)}<div class="spacer"><div class="between"><span class="small bold">${next ? t('nextLevel') + ': ' + next.level : t('maxRank')}</span><span class="muted small">${n(s.wallet.hold, 0)} / ${n(next?.hold || s.wallet.hold, 0)} COIN</span></div>${progress(s.wallet.hold, next?.hold || s.wallet.hold || 1)}<p class="muted tiny">${next ? t('holdNext', { amount: n(next.hold, 0), level: next.level }) : t('walletOnly')}</p></div>${I('chevron', 'small')}</div>`;
  }
  function taskHomeCard() {
    const s = S(), st = s.tasks.streak;
    const ready = now() - st.last >= 86400000 && st.day < D.streakDays;
    const reward = Math.round(300 + (st.day + 1) * 120);
    return `<section class="panel art-card" ${artStyle('tasks')}><div class="row">${B('gift', 'goldbox')}<div class="spacer"><h2>${t('missionCenter')}</h2><p class="muted small">${t('missionHomeSub')}</p></div></div><div class="between" style="margin:10px 0"><span class="small">${t('dailyStreak')} · ${t('day')} ${st.day}/30</span><b class="gold">+${n(reward, 0)} COIN</b></div>${progress(st.day, 30, 'gold')}<div class="two-cols" style="margin-top:10px">${btn(ready ? t('claimReward') : t('claimed'), 'claim-streak', { cls: ready ? 'primary' : 'secondary', disabled: !ready, icon: 'gift' })}${navBtn('tasks', 'allTasks', 'arrow')}</div></section>`;
  }
  function home() {
    return `${hero('app', 'official', 'home')}<div class="small muted" style="margin:0 9px 10px">${t('tagline')}</div>${balanceCard()}${miningHero()}
      ${stats([
        ['hourly', `<span id="rate-hourly">${n(miningView().dailyRate / 24, 1)}</span>`, 'COIN/h', 'bolt', 'cyan'],
        ['daily', `<span id="rate-daily">${n(miningView().dailyRate, 0)}</span>`, 'COIN/day', 'calendar', 'green'],
        ['boost', '×' + n(S().mining.multiplier, 2), t('multiplier'), 'chart', 'gold'],
        ['league', t(S().mining.league), 'Lv.' + S().mining.level, 'shield', 'gold']
      ])}${levelCard()}${taskHomeCard()}
      <div class="feature-grid"><section class="panel feature art-card" ${artStyle('station')}><div class="row">${B('station', 'cyanbox')}<h2>${t('stationTitle')}</h2></div><p>${t('stationSub')}</p>${navBtn('station', 'openStation', 'chevron')}</section>
      <section class="panel feature art-card" ${artStyle('crates')}><div class="row">${B('box', 'purplebox')}<h2>${t('crates')}</h2></div><p>${t('cratesSub')}</p>${navBtn('crates', 'openCrates', 'chevron')}</section></div>
      <section class="panel invite-banner art-card" ${artStyle('friends')}>${B('friends', 'purplebox')}<div><h2>${t('inviteEarn')}</h2><p>${t('inviteSub')}</p></div>${navBtn('friends', 'inviteNow', 'friends')}</section>`;
  }
  function mining() {
    const v = miningView();
    return `${hero('miningTitle', 'miningSub', 'mining')}${miningHero()}
      ${stats([['baseRate', n(S().mining.baseDaily / 24, 1), 'COIN/h', 'bolt', 'cyan'],
        ['boost', '×' + n(S().mining.multiplier * (v.boosted ? D.boostMultiplier : 1), 2), t('multiplier'), 'chart', 'gold'],
        ['totalRate', `<span id="rate-hourly">${n(v.dailyRate / 24, 1)}</span>`, 'COIN/h', 'mining', 'green']], true)}
      <div class="panel cyan-border"><div class="row">${B('chart', 'cyanbox')}<div><h2>${t('production')}</h2><p class="bold"><span id="rate-daily">${n(v.dailyRate, 0)}</span> COIN / ${t('dayUnit')}</p></div></div>${chart(true)}<div class="between muted small"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span></div></div>
      ${levelCard()}<div class="inline-note">${I('info')}${t('walletOnly')}</div><div class="two-cols">${navBtn('station', 'stationTitle', 'station')}${navBtn('staking', 'staking', 'layers')}</div>`;
  }

  /* ---------- Station / Tower ---------- */
  function towerHero() {
    const s = S();
    return `<section class="panel glow art-card tower-hero" ${artStyle('station')}><div class="row">${B('station', 'cyanbox')}<h2>${t('stationOutput')}</h2><span class="spacer"></span><span class="muted small">${s.tower.floors.filter((f) => f.active).length} / 100</span></div>
      <div class="tower-main mono">${n(s.tower.rate, 1)} <small>COIN/h</small></div><div class="two-cols"><div class="subpanel"><p class="muted small">${t('activeFloors')}</p><strong>${s.tower.floors.filter((f) => f.active).length} / 100</strong></div><div class="subpanel"><p class="muted small">${t('unclaimed')}</p><strong class="cyan mono" id="tower-pending">${n(s.tower.pending, 4)} COIN</strong></div></div>
      ${btn(t('collect'), 'claim-tower', { cls: 'secondary', icon: 'coins', disabled: s.tower.pending < 0.0001, extraClass: 'wide', extra: 'style="margin-top:9px"' })}</section>`;
  }
  function floorCard(f) {
    const s = S();
    const stocks = [1, 2, 3, 4].map((tp) => ({ type: tp, have: E.partCount(tp, f.tier) }));
    const complete = f.slots.every((x) => x >= f.perSlot);
    return `<section class="panel floor-card ${f.locked ? 'disabled' : ''}"><div class="between"><div class="row"><span class="floor-number">#${f.floor}</span><div><h3>${t('floor')} #${f.floor}</h3><small class="muted">${t(D.tierClasses[f.tier] ? 'moduleClass' + (f.tier + 1) : 'common')} · ${t(D.tiers[f.tier])}</small></div></div>
      <div style="text-align:right"><strong class="green small">+${n(f.income, 0)} COIN/h</strong><br><small class="${f.active ? 'green' : f.locked ? 'muted' : 'gold'}">${f.active ? '● ' + t('active') + ' · ' + f.rank + '★' : f.locked ? '▣ ' + t('locked') : '○ ' + t('assembling')}</small></div></div>
      <div class="slots">${[1, 2, 3, 4].map((tp) => `<button class="slot ${f.slots[tp - 1] >= f.perSlot ? 'complete' : ''}" data-action="install:${f.floor}:${tp}" ${f.locked || f.slots[tp - 1] >= f.perSlot || stocks[tp - 1].have < 1 ? 'disabled' : ''} aria-label="${t('install')} ${t(D.partNames[tp])}">${partImg(tp)}<span class="part-count">${f.slots[tp - 1]} / ${f.perSlot}</span><small>${t(D.partNames[tp])}</small></button>`).join('')}</div>
      ${f.active && f.rank < 5 ? btn(t('upgrade') + ' · ' + (f.rank + 1) + '★', 'upgrade:' + f.floor, { cls: 'secondary', icon: 'bolt', extraClass: 'wide', extra: 'style="margin-top:10px"' }) : ''}</section>`;
  }
  function floorsView() {
    const s = S(), ui = global.APP.ui;
    const sector = D.sectors[(ui.sector || 1) - 1];
    return `<div class="sector-tabs">${D.sectors.map((x, i) => `<button class="${(ui.sector || 1) === i + 1 ? 'active' : ''}" data-action="sector:${i + 1}"><strong>${t('sector')} ${i + 1} · ${x.key}</strong><small>${x.from}–${x.to} · ${t('moduleClass' + (x.tier + 1))} · ${t('perSlot', { count: x.perSlot })}</small></button>`).join('')}</div>
      <div class="panel between small"><span>${t('assembly')}<br><b class="cyan">${t('moduleClass' + (sector.tier + 1))} · ${t('perSlot', { count: sector.perSlot })}</b></span><b>${sector.from}–${sector.to}</b></div>
      ${s.tower.floors.filter((f) => f.floor >= sector.from && f.floor <= sector.to).map(floorCard).join('')}`;
  }
  function station() {
    const ui = global.APP.ui, tab = ['floors', 'crates', 'crafting'].includes(ui.stationTab) ? ui.stationTab : 'floors';
    return `${hero('stationTitle', 'buildPower', 'station')}${towerHero()}<div class="tabs">${[['floors', 'floors'], ['crates', 'crates'], ['crafting', 'crafting']].map(([k, l]) => btn(t(l), 'station-tab:' + k, { cls: tab === k ? 'active' : '' })).join('')}</div>${tab === 'crates' ? cratesPage(true) : tab === 'crafting' ? workshopPage() : floorsView()}`;
  }

  /* ---------- Crates & Workshop ---------- */
  function crateTile(c) {
    const ui = global.APP.ui;
    const used = S().ledger.filter((x) => x.kind === 'crate_purchase' && x.metaKind === c.key && x.created_ms > now() - 86400000).length;
    return `<div class="crate-tile ${ui.crateKey === c.key ? 'selected' : ''}"><span class="badge">${t(c.badge) === c.badge ? c.badge : t(c.badge)}</span><img src="${asset(c.image)}" alt="" loading="lazy"><h3>${t(c.name)}</h3><p class="muted tiny">${t(c.desc)}</p><p class="gold small">${n(c.price, 0)} COIN · ${c.count}x</p><p class="muted tiny">${used}/${c.limit} · ${t('dailyLimit')}</p>${btn(t('crateConfirmOpen'), 'crate-details:' + c.key, { cls: 'secondary', extraClass: 'wide', extra: 'style="min-height:32px;font-size:10px"' })}</div>`;
  }
  function cratesPage(embedded = false) {
    const ui = global.APP.ui;
    const filter = ui.crateFilter || 'all';
    const list = Object.values(D.crates).filter((c) => filter === 'all' || c.filter === filter);
    return `${embedded ? '' : hero('crates', 'crateSubtitle', 'crates')}<div class="tabs">${[['all', 'all'], ['standard', 'crateFilterStandard'], ['special', 'crateFilterSpecial']].map(([k, l]) => btn(t(l), 'crate-filter:' + k, { cls: filter === k ? 'active' : '' })).join('')}</div>
      <div class="crate-grid">${list.map(crateTile).join('')}</div><div class="inline-note" style="margin-top:11px">${I('info')}${t('crateGuaranteeRule', { tier: t('rare') })}</div>`;
  }
  function inventoryGrid() {
    const ui = global.APP.ui, s = S();
    const type = ui.partType || 0, tier = ui.tier || 0;
    const items = s.tower.inventory.filter((x) => x.count > 0 && (!type || x.type === type) && (!tier || x.tier === tier - 1));
    return `<div class="pill-row">${[0, 1, 2, 3, 4].map((x) => btn(x ? t(D.partNames[x]) : t('all'), 'part-filter:' + x, { cls: 'pill ' + ((ui.partType || 0) === x ? 'active' : '') })).join('')}</div>
      <div class="pill-row">${[0, 1, 2, 3, 4, 5].map((x) => btn(x ? t(D.tiers[x - 1]) : t('all'), 'inventory-tier:' + x, { cls: 'pill ' + ((ui.tier || 0) === x ? 'active' : '') })).join('')}</div>
      ${items.length ? `<div class="inv-grid">${items.map((x) => `<button class="inv-item" data-action="part:${x.type}:${x.tier}">${partImg(x.type)}<b>×${x.count}</b><small>${t(D.partNames[x.type])}</small><span class="tier-chip">${t(D.tiers[x.tier])}</span></button>`).join('')}</div>` : empty('emptyInventory', 'box')}`;
  }
  function workshopPage() {
    const ui = global.APP.ui, type = ui.craftType || 1, s = S();
    const have = E.partCount(type, 0);
    const fee = Math.round((D.crates.small.price / 3) * D.synthesisFee);
    return `<div class="panel art-card" ${artStyle('crafting')}><h2>${t('workshopTitle')}</h2><p class="muted small" style="margin-top:6px">${t('workshopDescription')}</p></div>
      <div class="pill-row">${[1, 2, 3, 4].map((x) => btn(t(D.partNames[x]), 'craft-type:' + x, { cls: 'pill ' + (type === x ? 'active' : '') })).join('')}</div>
      <section class="panel"><div class="row">${partImg(type)}<div class="spacer"><h3>${t(D.partNames[type])} · ${t(D.tiers[0])}</h3><p class="muted small">${t('workshopInStock')}: <b class="cyan">${have}</b> / 3</p></div></div>
        ${progress(have, 3, 'cyan')}<div class="between small" style="margin-top:9px"><span class="muted">${t('synthesisFee')}</span><b>${n(fee, 2)} COIN</b></div>
        ${btn(t('synthesize'), 'craft:' + type + ':0', { cls: have >= 3 && s.mining.balance >= fee ? 'primary' : 'secondary', disabled: have < 3 || s.mining.balance < fee, icon: 'spark', extraClass: 'wide', extra: 'style="margin-top:12px"' })}</section>
      ${sectionTitle('yourInventory')}${inventoryGrid()}`;
  }

  /* ---------- Friends ---------- */
  function friends() {
    const s = S();
    const req = D.levels[1];
    const vals = { level: req.level, hold: n(req.hold, 0), percent: s.friends.percent };
    const link = D.inviteLink(s.user.id);
    return `${hero('inviteEarn', 'friendsSub', 'friends')}<div class="panel art-card friends-hero" ${artStyle('friends')}><div class="percentage-row"><span class="hero-percentage">${s.friends.percent}%</span><p>${t('fromMining')}</p></div></div>
      ${stats([['invited', s.friends.refs.length, '', 'friends', 'purple'], ['active', s.friends.refs.filter((r) => r.active).length, '', 'friends', 'green'], ['earned', n(s.friends.earned, 2), 'COIN', 'coins', 'purple']], true)}
      ${btn(t('commissionHistory'), 'commission-history:all', { cls: 'secondary', icon: 'history', extraClass: 'wide' })}
      <div class="panel glow art-card" ${artStyle('friends')}><h2>${t('yourLink')}</h2><div class="ref-link"><span>${esc(link)}</span><button class="btn btn-ghost text-button" data-action="copy-link" aria-label="${t('copyLink')}">${I('copy')}</button></div>
      <div class="two-cols">${btn(t('inviteFriends'), 'invite', { icon: 'send' })}${btn(t('copyLink'), 'copy-link', { cls: 'secondary', icon: 'copy' })}</div><p class="muted small" style="margin-top:10px">${t('activeRule')}</p></div>
      ${sectionTitle('yourCrew', `<span class="muted small">${s.friends.refs.length}</span>`)}<div class="inline-note">${I('info')}${t('referralAutoCredit')}</div>
      <div class="panel referral-list">${s.friends.refs.map((r) => `<div class="list-row referral-row"><div class="referral-person"><span class="avatar">${esc(r.name[0])}</span><div><h3>${esc(r.name)}</h3><span class="muted small">${t('level')} ${r.level}</span></div></div><span class="referral-status ${r.active ? 'green' : 'gold'} small">${t(r.active ? 'referralCommissionActive' : 'referralNeedLevel', vals)}</span>${r.active ? '' : `<p class="referral-note muted small">${t('referralUnlockHint', vals)}</p>`}</div>`).join('') || empty('noFriends', 'friends')}</div>
      <div class="panel invite-banner art-card link-card" data-action="nav:ambassadors" ${artStyle('ambassadors')}>${B('crown', 'goldbox')}<div><h2>${t('becomeAmbassador')}</h2><p>${t('higherRewards')}</p></div>${I('chevron')}</div>`;
  }

  /* ---------- Wallet ---------- */
  function activityPage() {
    const s = S(), ui = global.APP.ui, filter = ui.activity || 'all';
    const entries = [...s.ledger, ...(s.market.swaps || []).map((x) => ({ id: 'swap-' + x.id, kind: x.side === 'buy' ? 'swap_buy' : 'swap_sell', amount: x.side === 'buy' ? x.receive : -x.offer, created_ms: x.created_ms, status: x.status, swapId: x.id }))].sort((a, b) => b.created_ms - a.created_ms);
    const shown = entries.filter((x) => filter === 'all' || (filter === 'received' ? x.amount >= 0 : x.amount < 0));
    const names = { mining_claim: 'mining', tower_claim: 'station', crate_purchase: 'crates', synthesis: 'crafting', floor_upgrade: 'station', stake_locked: 'staking', stake_matured: 'staking', daily_reward: 'dailyReward', referral_reward: 'referralReward', withdrawal_reserved: 'withdraw', withdrawal_refund: 'withdraw', opening_balance: 'appBalance', sandbox_credit: 'localSandbox', task_reward: 'tasks', chain_deposit: 'deposit', swap_buy: 'buy', swap_sell: 'sellTab' };
    return `<section class="panel"><div class="section-title" style="margin-top:0"><h2>${t('recentActivity')}</h2><button class="btn btn-ghost text-button" data-action="export" aria-label="${t('exportHistory')}">${I('download')}</button></div>
      <div class="pill-row">${['all', 'received', 'sent'].map((k) => btn(t(k), 'activity:' + k, { cls: 'pill ' + (filter === k ? 'active' : '') })).join('')}</div>
      ${shown.slice(0, 30).map((x) => `<div class="list-row link-card" role="button" tabindex="0" data-action="activity-detail:${x.id}">${B(x.amount < 0 ? 'upload' : 'download', x.amount < 0 ? 'purplebox' : 'greenbox')}<div><h3>${t(names[x.kind] || 'appBalance')}</h3><p class="muted small">${T.fmtDate(x.created_ms)}</p></div><div class="value"><strong class="${x.amount < 0 ? 'purple' : 'green'} small">${x.amount >= 0 ? '+' : ''}${n(x.amount, 2)} COIN</strong><p class="muted small">${t('completed')}</p></div></div>`).join('') || empty('noActivity', 'clock')}</section>`;
  }
  function wallet() {
    const s = S(), w = s.wallet;
    return `${hero('wallet', 'walletSub', 'wallet')}<section class="panel glow art-card wallet-balance" ${artStyle('wallet')}><div class="row small bold ${w.address ? 'green' : 'muted'}">${I('wallet')}${t('wallet') + ' · ' + t(w.address ? 'connected' : 'disconnected')}</div>
      <p class="muted small" style="margin-top:12px">${t('onChain')}</p><div class="wallet-number mono">${n(w.hold, 4)} <small>COIN</small></div><div class="ton-row">▽ ${n(w.ton, 4)} TON</div>
      ${w.address ? `<div class="address">${I('wallet', 'small')}<span>${esc(shortAddr(w.address))}</span><button class="btn btn-ghost text-button" data-action="copy-address">${I('copy', 'small')}</button><button class="btn btn-ghost text-button" data-action="refresh-wallet">${I('refresh', 'small')}</button></div>` : btn(t('connectWallet'), 'connect', { cls: 'primary', icon: 'wallet', extraClass: 'wide', extra: 'style="margin-top:10px"' })}</section>
      ${balanceCard()}
      ${w.address ? `<div class="action-grid">${btn(t('buy'), 'nav:market', { icon: 'plus' })}${btn(t('withdraw'), 'nav:withdraw', { icon: 'upload' })}${btn(t('swap'), 'nav:market', { icon: 'swap' })}</div>` : ''}
      <div class="inline-note link-card" data-action="nav:leagues">${I('chart')}${t('walletOnly')}${I('chevron', 'small')}</div>
      ${w.address && !w.verified ? `<section class="panel cyan-border"><h3>${t('verification')}</h3><p class="muted small" style="margin:6px 0 10px">${t('verifySub')}</p>${btn(t('verifyWallet'), 'verify-wallet', { cls: 'secondary', icon: 'shield', extraClass: 'wide' })}</section>` : ''}
      <div class="two-cols" style="margin-bottom:11px">${btn(t('deposit'), 'deposit', { cls: 'secondary', icon: 'download' })}${navBtn('staking', 'staking', 'layers')}</div>
      ${s.payments.length ? `<section class="panel"><h2>${t('paymentHistory')}</h2><p class="muted small">${t('paymentAuto')}</p>${s.payments.map((p) => `<div class="list-row">${B(p.status === 'paid' ? 'check' : 'clock', p.status === 'paid' ? 'greenbox' : 'cyanbox')}<div class="spacer"><h3>${t(p.kind === 'deposit' ? 'deposit' : 'verification')}</h3><p class="muted small">${n(p.amount, 2)} ${p.kind === 'deposit' ? 'COIN' : 'TON'} · ${T.fmtDate(p.createdAt)}</p><small class="${p.status === 'paid' ? 'green' : 'muted'}">${t(p.status === 'paid' ? 'completed' : p.status === 'expired' ? 'paymentExpired' : 'pending')}</small></div>${p.canCheck ? btn(t('check'), 'check-payment:' + p.id, { cls: 'secondary', icon: 'refresh' }) : ''}</div>`).join('')}</section>` : ''}
      ${activityPage()}
      <section class="panel invite-banner art-card" ${artStyle('wallet')}>${B('shield', 'goldbox')}<div><h3>${t('youControl')}</h3><p>${t('reviewTransaction')}</p></div></section>`;
  }

  /* ---------- Market ---------- */
  function market() {
    const s = S(), ui = global.APP.ui, price = D.marketPrice;
    const amount = Number(ui.tradeAmount) || 0;
    const receive = Math.max(0, amount / price * (1 - D.slippage) - D.serviceFee / price);
    return `${hero('market', 'marketSub', 'market')}<section class="panel glow market-pair"><div class="between"><div class="row">${B('market', 'purplebox')}<b>COIN / TON</b></div><span class="pill small">STON.fi</span></div>
      <div class="price-number mono" style="margin-top:12px">${n(price, 7)} <small>TON</small></div><p class="muted small">${t('marketPrice')} · 1 COIN</p>${chart(false)}</section>
      <div class="tabs">${btn(t('buyTab'), 'market-tab:buy', { cls: ui.marketTab !== 'history' ? 'active' : '' })}${btn(t('marketHistoryTab'), 'market-tab:history', { cls: ui.marketTab === 'history' ? 'active' : '' })}</div>
      ${ui.marketTab === 'history' ? `<section class="panel"><h2>${t('marketHistoryTitle')}</h2>${s.market.swaps.map((x) => `<div class="list-row">${B('market', 'greenbox')}<div class="spacer"><h3>${n(x.offer, 4)} TON</h3><p class="muted small">${T.fmtDate(x.created_ms)}</p></div><strong class="value purple small">+${n(x.receive, 0)} COIN</strong></div>`).join('') || empty('marketHistoryEmpty', 'clock')}</section>` : `<form class="panel glow swap-form" id="trade-form"><label class="form-label" for="trade-amount">${t('youPay')}</label>${amountInput('trade-amount', ui.tradeAmount || '1', 'TON')}
        <p class="muted small" style="margin-top:6px">${t('marketOnchainBalance')}: ${n(s.wallet.ton, 4)} TON</p><div class="market-direction">${I('swap')}</div>
        <label class="form-label">${t('youReceive')} ≈</label><div class="amount-input"><strong id="trade-receive" class="spacer cyan mono market-estimate">${n(receive, 0)}</strong><b class="purple">COIN</b></div>
        <div class="subpanel" style="margin:12px 0">${summaryRow(t('serviceFee'), n(D.serviceFee, 3) + ' TON')}${summaryRow(t('slippage'), '0.5%')}${summaryRow(t('marketBeforeNetwork'), `<span id="trade-total">${n(amount + D.serviceFee, 3)} TON</span>`, true)}</div>
        <p class="muted small">${t('marketQuoteHint')}</p>${btn(t('reviewPurchase'), 'review-trade', { icon: 'market', extraClass: 'wide', extra: 'style="margin-top:12px"' })}
        ${!s.wallet.address ? btn(t('connectWallet'), 'connect', { cls: 'secondary', icon: 'wallet', extraClass: 'wide', extra: 'style="margin-top:8px"' }) : ''}</form>`}
      <a class="btn btn-secondary wide market-external" href="https://ston.fi" target="_blank" rel="noopener noreferrer">${I('market')}${t('openDex')} ↗</a>
      <section class="panel market-wallet-note">${B('wallet', 'cyanbox')}<div><h3>${t('onChain')}</h3><p class="muted small">${t('marketWalletInfo')}</p>${navBtn('wallet', 'wallet', 'chevron')}</div></section>`;
  }

  /* ---------- Staking ---------- */
  function staking() {
    const s = S(), ui = global.APP.ui, plan = D.stakingPlans.find((p) => p.days === ui.plan) || D.stakingPlans[0];
    const amount = Number(document.getElementById('stake-amount')?.value) || 0;
    const reward = amount * plan.percent / 100;
    return `${hero('stakingTitle', 'stakingSub', 'staking')}<div class="panel balance-card art-card" ${artStyle('staking')}>${B('coins')}<div><p class="muted small">${t('availableStake')}</p><div class="amount mono">${n(s.mining.balance, 4)} <span class="unit">COIN</span></div><p class="muted small">${t('appBalance')}</p></div></div>
      <div class="panel glow"><h3>${t('chooseDuration')}</h3><div class="three-cols" style="margin-top:10px">${D.stakingPlans.map((p) => `<button class="plan ${ui.plan === p.days ? 'active' : ''}" data-action="plan:${p.days}">${p.days} ${t('days')}<span class="rate">+${p.percent}%</span></button>`).join('')}</div>
      <p class="muted small" style="margin-top:8px">${t('termReward')}</p><label class="form-label" for="stake-amount">${t('stakeAmount')}</label>${amountInput('stake-amount', '1000', 'COIN')}
      <p class="muted small" style="margin-top:5px">${t('minStake')} · ${n(s.staking.staked, 0)} / ${n(s.staking.limit, 0)} COIN</p>
      <div class="subpanel" style="margin:12px 0">${summaryRow(t('estimatedReward'), `<span id="stake-reward" class="cyan">+${n(reward, 2)} COIN</span>`)}${summaryRow(t('totalMaturity'), `<span id="stake-total">${n(amount + reward, 2)} COIN</span>`)}${summaryRow(t('duration'), plan.days + ' ' + t('days'))}</div>
      ${btn(t('reviewStake'), 'review-stake', { icon: 'bolt', extraClass: 'wide' })}<p class="muted small center" style="margin-top:9px">${t('lockedUntil')}</p></div>
      ${sectionTitle('activeStakes')}${s.staking.stakes.length ? s.staking.stakes.map((st) => {
        const pct = Math.max(0, Math.min(100, ((now() - st.createdAt) / (st.endsAt - st.createdAt)) * 100));
        const matured = st.endsAt <= now() && !st.claimed;
        return `<div class="panel"><div class="between"><div><h3>${n(st.amount, 2)} COIN</h3><p class="muted small">${st.days} ${t('days')} · +${st.percent}%</p></div><div style="text-align:right"><small class="muted">${t('estimatedReward')}</small><p class="cyan bold">+${n(st.reward, 2)} COIN</p></div></div>${progress(pct, 100, 'cyan')}<div class="between"><small class="muted">${st.claimed ? t('claimed') : matured ? t('matured') : t('remainingDays', { count: Math.ceil((st.endsAt - now()) / 86400000) })}</small>${matured ? btn(t('claimStake'), 'claim-stake:' + st.id, { cls: 'secondary' }) : ''}</div></div>`;
      }).join('') : `<div class="panel">${empty('noStakes', 'layers')}</div>`}`;
  }

  /* ---------- Tasks ---------- */
  function tasks() {
    const s = S(), ui = global.APP.ui, cat = ui.taskTab || 'all';
    const st = s.tasks.streak;
    const streakReady = now() - st.last >= 86400000 && st.day < D.streakDays;
    const reward = Math.round(300 + (st.day + 1) * 120);
    const list = D.missions.filter((m) => cat === 'all' || m.cat === cat);
    return `${hero('tasks', 'tasksSub', 'tasks')}<section class="panel art-card" ${artStyle('task-daily')}><div class="row">${B('gift', 'goldbox')}<div><h2>${t('dailyStreak')}</h2><p class="muted small">${t('streakNotice')}</p></div></div>
      <div class="streak-days">${Array.from({ length: 10 }, (_, i) => `<div class="streak-day ${i < st.day ? 'done' : i === st.day ? 'today' : ''}"><b>${i + 1}</b><br>${t('day')}</div>`).join('')}</div>
      <div class="between"><span class="small">${t('dailyReward')}</span><b class="gold">+${n(reward, 0)} COIN</b></div>
      ${btn(streakReady ? t('claimReward') : t('claimed'), 'claim-streak', { cls: streakReady ? 'primary' : 'secondary', disabled: !streakReady, icon: 'gift', extraClass: 'wide', extra: 'style="margin-top:10px"' })}</section>
      ${btn('★ ' + (T.lang === 'id' ? 'Klaim semua hadiah siap' : 'Claim all ready rewards'), 'claim-all-tasks', { cls: 'secondary', icon: 'gift', extraClass: 'wide', extra: 'style="margin-bottom:10px"' })}
      <div class="tabs">${[['all', 'allTasks'], ['daily', 'missionDaily'], ['social', 'social'], ['milestones', 'milestones'], ['holding', 'missionHolding']].map(([k, l]) => btn(t(l), 'task-tab:' + k, { cls: cat === k ? 'active' : '' })).join('')}</div>
      ${list.map((m) => {
        const ms = s.tasks.mission[m.id] || {};
        const available = E.missionAvailable(m.id);
        const cooldownLeft = ms.lastClaimed && m.cooldown ? Math.max(0, m.cooldown - (now() - ms.lastClaimed) / 3600000) : 0;
        const done = m.once && ms.claimed;
        return `<div class="mission-card ${available ? 'ready' : ''}"><div class="row"><img src="${asset(m.icon)}" alt="" width="42" height="42"><div class="spacer"><h3>${t(m.title)}</h3><p class="muted small">${t(m.desc, { amount: m.amount || 116 })}</p></div><b class="gold small">+${n(m.reward, 0)}</b></div>
          <div class="between" style="margin-top:9px"><small class="muted">${done ? t('claimed') : cooldownLeft > 0 ? t('missionNextReward') + ' ' + Math.ceil(cooldownLeft) + 'h' : available ? t('missionReady') : m.cooldown ? t('missionRepeat') : t('missionOnce')}</small>
          ${done ? '' : btn(available ? (m.kind === 'declared' || m.kind === 'telegram' ? t('go') : t('claim')) : t('check'), 'task-action:' + m.id + ':' + (available ? (m.kind === 'declared' || m.kind === 'telegram' ? 'start' : 'claim') : 'check'), { cls: available ? 'primary' : 'secondary', disabled: !available && !ms.started })}</div></div>`;
      }).join('') || empty('missionEmpty', 'gift')}
      <div class="inline-note">${I('info')}${t('missionSecure')}</div>`;
  }

  /* ---------- Leagues & Levels ---------- */
  function leagues() {
    const s = S();
    return `${hero('leagues', 'leaguesSub', 'leagues')}<section class="panel art-card league-current" ${artStyle('leagues')}><div><p class="muted small">${t('yourLeague')}</p><h2>${t(s.mining.league)}</h2><p class="muted small" style="margin-top:15px">${t('walletHold')}</p><h2>${n(s.wallet.hold, 0)} COIN</h2></div>${medal(s.mining.league, 70)}</section>
      ${levelCard()}${btn(t('browseLevels'), 'nav:' + levelLink(s.mining.level), { icon: 'search', extraClass: 'wide' })}
      ${sectionTitle('leagueProgression')}${D.leagues.map((l) => `<button class="panel league-row art-card link-card" data-action="nav:levels?league=${l.key}" ${artStyle('leagues')}>${medal(l.key, 52)}<span class="league-summary"><strong>${t(l.key)}</strong><span class="muted small">${t('levelRange', l)}</span><span class="cyan small">${t('viewLeagueLevels')}</span></span><span class="spacer"></span>${s.mining.league === l.key ? `<span class="pill status small">● ${t('current')}</span>` : ''}${I('chevron', 'small')}</button>`).join('')}
      <div class="inline-note">${I('info')}${t('walletOnly')}</div>`;
  }
  function levelLink(level) {
    const league = D.leagueOf(level);
    return `levels?league=${league.key}&page=${Math.floor((level - league.from) / 20) + 1}&level=${level}`;
  }
  function levels() {
    const params = new URLSearchParams(global.APP.query || '');
    const s = S();
    const league = D.leagues.find((l) => l.key === params.get('league')) || D.leagueOf(s.mining.level);
    const pages = Math.ceil((league.to - league.from + 1) / 20);
    const page = Math.max(1, Math.min(pages, Number(params.get('page')) || 1));
    const rows = D.levels.slice(league.from - 1 + (page - 1) * 20, Math.min(league.to, league.from - 1 + page * 20));
    return `${hero('levels', 'levelsSub', 'leagues', true)}<div class="sector-tabs">${D.leagues.map((l) => `<button class="${l.key === league.key ? 'active' : ''}" data-action="nav:levels?league=${l.key}">${medal(l.key, 40)}<strong>${t(l.key)}</strong><small>${l.from}–${l.to}</small></button>`).join('')}</div>
      <section class="panel level-browser"><div class="between"><div><h2>${t(league.key)}</h2><p class="muted small">${t('levelRange', league)}</p></div>${btn(t('yourLevel'), 'nav:' + levelLink(s.mining.level), { cls: 'secondary', icon: 'shield' })}</div>
      <form id="level-search-form" class="level-search" style="display:flex;gap:7px;margin:11px 0"><input id="level-search" type="number" min="1" max="500" inputmode="numeric" placeholder="${t('findLevel')} · 1–500" value="${params.get('level') || ''}">${btn(t('search'), 'find-level', { cls: 'secondary', icon: 'search' })}</form>
      <div class="level-columns muted small" style="display:grid;grid-template-columns:1.2fr 1fr 1fr 20px;gap:6px;padding:0 4px 6px"><span>${t('level')}</span><span>${t('walletHold')}</span><span>COIN / ${t('dayUnit')}</span><span></span></div>
      <div class="level-entries">${rows.map((x) => `<button class="level-entry panel" style="display:grid;grid-template-columns:1.2fr 1fr 1fr 20px;gap:6px;align-items:center;text-align:left;margin-bottom:5px;padding:8px" data-action="level-detail:${x.level}"><span class="row">${medal(league.key, 28)}<b>${x.level}</b></span><span>${n(x.hold, 0)}<small class="muted"> COIN</small></span><span class="cyan">${n(x.daily, 0)}<small class="muted"> /h ${n(x.daily / 24, 1)}</small></span>${I('chevron', 'small')}</button>`).join('')}</div>
      <div class="between" style="margin-top:10px">${btn(I('back'), `nav:levels?league=${league.key}&page=${page - 1}`, { cls: 'secondary', disabled: page === 1 })}${t('levelsShown', { from: rows[0]?.level, to: rows[rows.length - 1]?.level, total: 500 })}${btn(I('arrow'), `nav:levels?league=${league.key}&page=${page + 1}`, { cls: 'secondary', disabled: page === pages })}</div></section>`;
  }

  /* ---------- Profile / Ambassador / Withdraw / Settings ---------- */
  function profile() {
    const s = S(), m = s.mining;
    const stat = (label, value, unit, image, target) => `<button class="panel profile-stat link-card" data-action="nav:${target}" style="display:flex;align-items:center;gap:10px;width:100%"><img src="${asset(image)}" alt="" width="46" height="46"><span style="flex:1"><small class="muted">${t(label)}</small><br><strong>${value}</strong><br><small class="muted">${unit}</small></span>${I('chevron', 'small')}</button>`;
    return `${hero('profile', 'profileSub', 'profile')}<section class="panel profile-identity" style="display:flex;align-items:center;gap:12px"><img class="profile-avatar" src="${s.user.photoUrl || asset('profile-avatar')}" alt="" width="72" height="72" style="border-radius:50%"><div class="spacer"><h2>${esc(s.user.name)}</h2><p class="muted small">${t('explorerId')}: ${esc(s.user.id)}</p><p class="muted small">${t('memberSince', { date: T.fmtDate(s.user.joinedAt) })}</p></div><button class="btn btn-ghost" data-action="nav:settings">${I('settings')}</button></section>
      <section class="panel glow profile-rank"><div class="row">${medal(m.league, 56)}<div class="spacer"><p class="muted small">${t('yourLevel')}</p><h2>${t('level')} ${m.level}</h2><span class="pill gold small">${t(m.league)}</span></div></div>
      <div class="between small" style="margin-top:10px"><span>${m.next ? t('nextLevel') + ': ' + m.next.level : t('maxRank')}</span><strong class="cyan">${m.next ? n(Math.max(0, m.next.hold - s.wallet.hold), 0) + ' COIN' : '✓'}</strong></div>${progress(s.wallet.hold, m.next?.hold || s.wallet.hold || 1, 'purple')}</section>
      ${s.admin?.isAdmin || s.admin?.authenticated ? `<button class="btn btn-danger wide" data-action="nav:admin" style="margin:11px 0">${I('shield')} PANEL ADMIN</button>` : ''}
      <div class="stats">${stat('appBalance', n(m.balance, 2), 'COIN', 'crystal', 'wallet')}${stat('daily', n(m.daily, 0), 'COIN / ' + t('dayUnit'), 'power', 'mining')}${stat('activeFloors', s.tower.floors.filter((f) => f.active).length + ' / 100', t('station'), 'chip', 'station')}${stat('yourCrew', s.friends.refs.length, t('activeFriends') + ': ' + s.friends.refs.filter((r) => r.active).length, 'profile-avatar', 'friends')}</div>
      ${sectionTitle('leagueBadges', btn(t('viewAll'), 'nav:leagues', { cls: 'text-button' }))}<div class="panel badge-collection" style="display:flex;justify-content:space-around">${D.leagues.map((l) => `<button data-action="nav:levels?league=${l.key}" style="opacity:${m.level >= l.from ? 1 : .35}">${medal(l.key, 48)}</button>`).join('')}</div>
      ${sectionTitle('moduleCollection')}<div class="panel inv-grid">${[1, 2, 3, 4].map((tp) => `<div class="inv-item">${partImg(tp)}<b>×${s.tower.inventory.filter((x) => x.type === tp).reduce((a, b) => a + b.count, 0)}</b><small>${t(D.partNames[tp])}</small></div>`).join('')}</div>`;
  }
  function ambassadors() {
    const s = S(), a = s.ambassador;
    const refs = s.friends.refs.filter((r) => r.active).length;
    const members = a.verification?.members || a.applications[0]?.subs || 0;
    return `${hero('ambassadors', 'ambassadorSub', 'ambassadors')}<div class="panel art-card ambassador-hero" ${artStyle('ambassadors')}><div class="row">${B('crown', 'goldbox')}<div><p class="muted small">${t('yourStatus')}</p><h2>${t(a.tier ? D.ambassadorTiers.find((x) => x.percent === a.tier)?.name || 'bronze' : 'communityPartner')}</h2><p class="gold bold small">${s.friends.percent}% ${t('referralReward')}</p></div></div></div>
      <div class="panel cyan-border"><h2>${t('unlockAmbassador')}</h2><p class="muted small">${t('meetRequirements')}</p><div class="requirement-row"><span>${t('activeFriends')}</span>${progress(refs, 100, 'cyan')}<b>${refs}/100</b></div><div class="requirement-row"><span>${t('channelSubscribers')}</span>${progress(members, 2000, 'purple')}<b>${members}/2k</b></div></div>
      ${sectionTitle('ambassadorTiers')}${D.ambassadorTiers.map((x, i) => `<div class="panel ambassador-tier" style="display:flex;align-items:center;gap:10px"><img class="medal" src="${asset('medal-' + ['bronze', 'silver', 'gold', 'platinum', 'legendary'][i])}" alt="" width="44" height="44"><div class="spacer"><h3>${t(x.name)}</h3><small class="muted">${x.refs} ${t('activeFriends')} · ${n(x.subs, 0)} ${t('channelSubscribers')}</small></div><b class="gold">${x.percent}%</b></div>`).join('')}
      <section class="panel"><h2>${t('partnerPortalTitle')}</h2><p class="muted small" style="margin:6px 0 10px">${t('partnerPortalIntro')}</p>
      ${a.applications.length ? a.applications.map((x) => `<div class="list-row">${B('clock', 'goldbox')}<div class="spacer"><h3>${esc(x.channel)}</h3><small class="muted">${T.fmtDate(x.createdAt)}</small></div><span class="pill status small">${t(x.status === 'pending' ? 'applicationPending' : x.status)}</span></div>`).join('') : `<label class="form-label">${t('ambassadorChannelLabel')}</label><input id="amb-channel" type="text" placeholder="@username atau https://t.me/..." value="${esc(a.verification?.channel || '')}">${a.verification ? `<p class="green small" style="margin-top:7px">${t('ambassadorVerifiedStatus', { count: a.verification.members })}</p>` : ''}<div class="two-cols" style="margin-top:10px">${btn(t('ambassadorCheck'), 'am:check', { cls: 'secondary' })}${btn(t('ambassadorApply'), 'am:apply', { cls: a.verification ? 'primary' : 'secondary', disabled: !a.verification })}</div>`}</section>`;
  }
  function withdraw() {
    const s = S(), w = s.wallet, ui = global.APP.ui;
    const gross = Number(ui.withdrawAmount) || 0;
    const required = round2(gross * D.withdrawHoldPct);
    const have = w.hold;
    const fee = round2(gross * D.withdrawFee), net = round2(gross - fee);
    const last = s.withdrawal.items[0];
    return `${hero('withdraw', 'withdrawSub', 'withdraw', true)}<div class="panel between"><div class="row">${B('wallet', 'cyanbox')}<div><p class="muted small">${t('connectedWallet')}</p><h3>${w.address ? shortAddr(w.address) : t('disconnected')}</h3></div></div>${w.address ? '' : btn(t('connectWallet'), 'connect', { cls: 'secondary' })}</div>
      <section class="panel glow"><p class="muted small">${t('availableApp')}</p><div class="price-number mono">${n(s.mining.balance, 2)} <small class="purple">COIN</small></div>
      <label class="form-label" for="withdraw-amount">${t('amount')}</label>${amountInput('withdraw-amount', ui.withdrawAmount || '10000', 'COIN')}<p class="muted small" style="margin-top:5px">${t('minimum')} ${n(D.withdrawMinimum, 0)} COIN · ${t('withdrawCooldown')} 24h</p></section>
      <div class="panel withdraw-hold"><div class="row">${B('shield', 'goldbox')}<div><p class="muted small">${t('holdRequirement')}</p><strong class="gold" id="hold-requirement">${n(required, 2)} COIN</strong><p class="muted small">${t('withdrawHoldRule')}</p></div></div>
      <div class="subpanel" style="margin-top:10px">${summaryRow(t('withdrawWalletHold'), n(have, 2) + ' COIN')}${summaryRow(t('withdrawMissingHold'), n(Math.max(0, required - have), 2) + ' COIN')}</div>
      <p class="${have >= required ? 'green' : 'red'} small" style="margin-top:8px">${t(have >= required ? 'requirementMet' : 'withdrawHoldMissing')}</p>
      ${w.address ? btn(t('refreshWallet'), 'refresh-wallet', { cls: 'secondary', icon: 'refresh', extraClass: 'wide', extra: 'style="margin-top:10px"' }) : ''}</div>
      ${!w.verified ? `<div class="inline-note gold">${I('info')}${t('err_wallet_verification_required')} <button class="btn btn-ghost text-button" data-action="verify-wallet">${t('verifyWallet')}</button></div>` : ''}
      ${!(w.ageDays >= 30 || w.dexTrades >= 1 || w.premium) ? `<div class="inline-note gold">${I('clock')}${t('ageRequired')}</div>` : ''}
      <div class="panel">${summaryRow(t('requested'), n(gross, 2) + ' COIN')}${summaryRow(t('serviceFee') + ' · 5%', '-' + n(fee, 2) + ' COIN')}${summaryRow(t('total'), n(net, 2) + ' COIN', true)}${btn(t('confirmWithdrawal'), 'confirm-withdraw', { icon: 'upload', extraClass: 'wide', extra: 'style="margin-top:12px"', disabled: gross < D.withdrawMinimum })}<p class="muted tiny center" style="margin-top:8px">${t('reviewDetails')}</p></div>
      ${sectionTitle('recentWithdrawals')}<div class="panel">${s.withdrawal.items.map((x) => `<div class="list-row">${B(x.status === 'paid' ? 'check' : 'clock', x.status === 'paid' ? 'greenbox' : 'goldbox')}<div class="spacer"><h3>${n(x.amount, 2)} COIN</h3><p class="muted small">${T.fmtDate(x.createdAt)} · ${shortAddr(x.address)}</p></div><span class="pill status small">${t(x.status === 'paid' ? 'completed' : x.status)}</span></div>`).join('') || empty('noWithdrawals', 'clock')}</div>`;
  }
  function round2(v) { return Number(Number(v || 0).toFixed(2)); }
  function settings() {
    const s = S(), lang = T.lang;
    return `${hero('settings', 'app', 'settings')}<div class="panel settings-identity"><span class="avatar">${esc((s.user.name || '?')[0])}</span><div><h2>${esc(s.user.name)}</h2><p class="muted small">ID: ${esc(s.user.id)}</p></div></div>
      <div class="panel">${option('tasks', 'nav:tasks', 'gift')}${option('language', 'language', 'globe', I18N.languages.find((x) => x[0] === lang)?.[2] || 'English')}${option('wallet', 'nav:wallet', 'wallet', t(s.wallet.address ? 'connected' : 'disconnected'))}${option('botMessages', 'bot-permission', 'send', t(s.prefs.botPermission ? 'botPermissionAllowed' : 'botPermissionEnable'))}${option('notifications', 'notifications', 'bell')}${option('support', 'nav:support', 'support')}${option('terms', 'nav:terms', 'info')}${option('privacy', 'nav:privacy', 'shield')}${s.admin?.isAdmin || s.admin?.authenticated ? option('admin', 'nav:admin', 'settings') : ''}</div>
      <section class="panel gold-border"><h2>${t('localSandbox')}</h2><p class="muted small" style="margin:8px 0">${t('sandboxDescription')}</p><div class="sandbox-grid">
      ${btn(t('demoWallet'), 'dev:wallet', { cls: 'secondary' })}${btn(t('addBalance'), 'dev:credit:10000', { cls: 'secondary' })}${btn(t('setHold'), 'dev:hold:2500', { cls: 'secondary' })}${btn(t('addParts'), 'dev:parts', { cls: 'secondary' })}${btn(t('advanceDay'), 'dev:advance:1', { cls: 'secondary' })}${btn(t('advanceMonth'), 'dev:advance:30', { cls: 'secondary' })}${btn(t('activeFriends') + ' +100', 'dev:referrals', { cls: 'secondary' })}${btn(t('processQueue'), 'dev:process', { cls: 'secondary' })}</div></section>`;
  }
  function option(label, action, ic, detail = '') {
    return `<button class="option-row" data-action="${action}">${I(ic)}<span>${t(label)}</span><small>${detail}</small>${I('chevron', 'arrow')}</button>`;
  }
  function support() {
    const s = S();
    return `${hero('support', 'supportSub', 'support')}<form class="panel" id="support-form" onsubmit="return false"><label class="form-label" for="subject">${t('subject')}</label><input id="subject" type="text" minlength="3" maxlength="120" required><label class="form-label" for="message">${t('message')}</label><textarea id="message" minlength="10" maxlength="4000" required></textarea><div style="margin-top:12px">${btn(t('sendTicket'), 'send-ticket', { icon: 'send', extraClass: 'wide' })}</div></form>
      ${sectionTitle('yourTickets')}${s.support.map((x) => `<div class="panel"><div class="between"><h3>${esc(x.subject)}</h3><small class="green">${t(x.status)}</small></div><p class="muted small" style="margin-top:9px">${esc(x.message)}</p>${x.replies.map((r) => `<div class="subpanel" style="margin-top:9px">${esc(r.text)}</div>`).join('')}</div>`).join('') || empty('noTickets', 'support')}`;
  }
  function legal(kind) {
    const keys = kind === 'privacy' ? ['privacyData', 'privacyAbuse', 'privacyAnalytics', 'privacySecurity'] : ['termsRewards', 'termsWithdrawals', 'termsAccounts'];
    return `${hero(kind, 'app', kind === 'privacy' ? 'privacy' : 'terms', true)}<article class="panel stack"><h2>${t(kind)}</h2><div class="inline-note">${I('info')}${t('sandboxDescription')}</div>${keys.map((k) => `<p class="muted">${t(k)}</p>`).join('')}${navBtn('support', 'support', 'support')}</article>`;
  }

  /* ---------- Admin ---------- */
  function admin() {
    const s = S(), a = s.admin;
    if (a.isAdmin === false && !a.authenticated) {
      return `${hero('admin', 'app', 'admin', true)}<section class="panel"><h2>${t('raDenied')}</h2><p class="muted small" style="margin-top:8px">${t('err_admin_required')}</p></section>`;
    }
    if (!a.authenticated) {
      return `${hero('admin', 'app', 'admin', true)}<section class="panel"><h2>${t(a.pin ? 'raUnlock' : 'raPinSetup')}</h2><p class="muted small" style="margin:8px 0">${t('raPinHint')}</p>
        <label class="form-label">${t('raPinSetup')}</label><input id="admin-pin" type="password" inputmode="numeric" maxlength="12" placeholder="••••">
        ${a.pin ? '' : `<label class="form-label">${t('raPinConfirm')}</label><input id="admin-pin2" type="password" inputmode="numeric" maxlength="12" placeholder="••••">`}
        ${a.lockedUntil > now() ? `<p class="red small">${t('raLocked')}: ${T.fmtDateTime(a.lockedUntil)}</p>` : ''}
        ${btn(t('confirm'), a.pin ? 'admin-login' : 'admin-setup', { icon: 'shield', extraClass: 'wide', extra: 'style="margin-top:13px"' })}<p class="muted tiny center" style="margin-top:9px">${t('raReopen')}</p></section>`;
    }
    const tabs = global.APP.ui.adminTab || 'overview';
    const allWithdrawals = s.adminWithdrawals || s.withdrawal.items;
    const pending = allWithdrawals.filter((w) => ['pending', 'approved', 'held', 'review'].includes(w.status));
    return `${hero('admin', 'app', 'admin', true)}<div class="tabs">${[['overview', 'raOverview'], ['withdrawals', 'withdrawals'], ['users', 'users'], ['audit', 'raAudit']].map(([k, l]) => btn(t(l), 'admin-tab:' + k, { cls: tabs === k ? 'active' : '' })).join('')}</div>
      ${tabs === 'overview' ? `<div class="stats three">${statBox('users', s.adminUsers?.length ?? (s.friends.refs.length + 1))}${statBox('withdrawals', pending.length)}${statBox('liability', n(s.mining.balance, 0))}</div>
        <div class="inline-note">${I('info')}${t('raRiskNotice')}</div>
        <section class="panel"><h3>${t('raTreasury')}</h3><p class="muted small">${t('raSignerReady')}</p>${btn(t('raLock'), 'admin-logout', { cls: 'secondary', icon: 'lock', extraClass: 'wide', extra: 'style="margin-top:10px"' })}</section>` : ''}
      ${tabs === 'withdrawals' ? `<section class="panel">${pending.map((w) => `<div class="panel" style="border-color:rgba(255,199,90,.25)"><div class="between"><div><h3>${n(w.amount, 2)} COIN</h3><small class="muted">${esc(w.name)} · ${shortAddr(w.address)}</small></div><span class="pill small">${t(w.status)}</span></div>
        <div class="between small" style="margin:8px 0"><span class="muted">${t('raGross')} ${n(w.gross, 0)} · ${t('raNet')} ${n(w.net, 0)}</span><b class="${w.risk > 20 ? 'red' : 'green'}">${t('raRisk')}: ${w.risk}</b></div>
        <div class="three-cols">${btn(t('approve'), 'admin-decision:' + w.id + ':approve', { cls: 'primary' })}${btn(t('raHold'), 'admin-decision:' + w.id + ':hold', { cls: 'secondary' })}${btn(t('reject'), 'admin-decision:' + w.id + ':reject', { cls: 'danger' })}</div>
        ${global.BACKEND?.remote && w.status === 'approved' ? btn('Tandai dibayar · TX hash', 'admin-mark-paid:' + w.id, { cls: 'secondary', extraClass: 'wide', extra: 'style="margin-top:7px"' }) : ''}</div>`).join('') || empty('noWithdrawals', 'clock')}</section>` : ''}
      ${tabs === 'users' ? `<section class="panel"><label class="form-label">${t('search')}</label><input id="admin-search" type="text" placeholder="${t('search')}">${btn(t('search'), 'admin-search', { cls: 'secondary', extraClass: 'wide', extra: 'style="margin-top:9px"' })}
        ${(s.adminUsers?.length ? s.adminUsers.map((u) => ({ id: u.id, name: u.name })) : [s.user, ...s.friends.refs.slice(0, 12)]).map((u) => `<div class="list-row"><span class="avatar">${esc((u.name || '?')[0])}</span><div class="spacer"><h3>${esc(u.name)}</h3><small class="muted">ID: ${esc(u.id)}</small></div>${btn(s.admin.restrictions[u.id]?.restricted ? t('raUnblock') : t('raBlock'), 'admin-moderate:' + u.id + ':' + (s.admin.restrictions[u.id]?.restricted ? '0' : '1'), { cls: 'secondary' })}</div>`).join('')}</section>` : ''}
      ${tabs === 'audit' ? `<section class="panel">${a.audit.map((x) => `<div class="list-row">${B('check', 'greenbox')}<div class="spacer"><h3>${t('raAction_' + x.decision) || x.decision}</h3><small class="muted">${T.fmtDateTime(x.at)} · ${esc(x.note || '')}</small></div></div>`).join('') || empty('noData', 'history')}</section>` : ''}`;
  }
  function statBox(label, value) { return `<div class="stat"><div class="label">${t(label)}</div><div class="value mono">${value}</div></div>`; }

  /* ---------- Modals ---------- */
  const modals = {
    language: () => ({ title: 'chooseLanguage', html: `<div class="lang-grid">${I18N.languages.map(([code, flag, label]) => `<button class="language-option ${T.lang === code ? 'selected' : ''}" data-action="choose-language:${code}">${flag} ${label}</button>`).join('')}</div>` }),
    notifications: () => ({ title: 'notifications', html: S().notifications.map((x) => `<div class="notification-card">${I('gift')}<div class="spacer"><h3>${t(x.key)}</h3><small class="muted">${T.fmtDateTime(x.at)}</small></div></div>`).join('') || empty('noNotifications', 'bell') }),
    crateDetails: (kind) => {
      const c = D.crates[kind], s = S();
      const used = s.ledger.filter((x) => x.kind === 'crate_purchase' && x.metaKind === kind && x.created_ms > now() - 86400000).length;
      return { title: c.name, className: 'crate-detail-sheet', html: `<div class="row"><img src="${asset(c.image)}" alt="" width="80" height="80"><div><p class="muted small">${t('crateSubtitle')}</p><h2>${t(c.name)}</h2><p class="gold bold small">${n(c.price, 0)} COIN</p></div></div>
        <p class="muted small" style="margin:10px 0">${t(c.desc)}</p>${summaryRow(t('randomModules', { count: c.count }), c.count + 'x')}${summaryRow(t('dailyLimit'), used + ' / ' + c.limit)}${c.guaranteed ? summaryRow(t('guaranteed', { tier: t(D.tiers[c.guaranteed]) }), '✓') : ''}${summaryRow(t('total'), n(c.price, 0) + ' COIN', true)}
        <div class="inline-note" style="margin-top:10px">${I('info')}${t('crateBundleOddsNote')}</div>
        <div class="two-cols" style="margin-top:11px">${btn(t('cancel'), 'close', { cls: 'secondary' })}${btn(t('crateConfirmOpen'), 'open-crate:' + kind, { disabled: s.mining.balance < c.price || used >= c.limit })}</div>` };
    },
    crateResult: (rewards) => ({ title: 'receivedModules', className: 'crate-result-sheet', html: `<div class="crate-open-anim">${rewards.map((r, i) => `<div class="reward" style="animation-delay:${i * 60}ms">${partImg(r.type)}<small>${t(D.partNames[r.type])}</small><span class="tier-chip">${t(D.tiers[r.tier])}</span></div>`).join('')}</div>${btn(t('continue'), 'close', { extraClass: 'wide' })}` }),
    upgrade: (floorNo) => {
      const f = S().tower.floors[floorNo - 1], q = D.upgradeQuote(f.floor, f.tier, f.rank - 1);
      if (!q) return null;
      const stocks = [1, 2, 3, 4].map((tp) => ({ tp, have: E.partCount(tp, q.tier) }));
      const can = stocks.every((x) => x.have >= q.perType) && S().mining.balance >= q.cost;
      return { title: 'upgrade', className: 'floor-upgrade-sheet', html: summaryRow(t('floor'), '#' + f.floor) + summaryRow(t('floorRank'), f.rank + '★ → ' + q.rank + '★') + summaryRow(t('production'), n(f.income, 0) + ' → ' + n(q.income, 0) + ' COIN/h') + summaryRow(t('total'), n(q.cost, 0) + ' COIN', true) + `<h3 style="margin-top:11px">${t('upgradeMaterials', { class: t('moduleClass' + (q.tier + 1)) })}</h3><p class="muted small">${t('upgradePartsTotal', { count: q.totalParts, perType: q.perType })}</p><div class="floor-upgrade-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:9px">${stocks.map((x) => `<div class="floor-upgrade-part ${x.have >= q.perType ? 'green' : 'gold'}" style="text-align:center">${partImg(x.tp)}<small>${t(D.partNames[x.tp])}</small><b>${x.have}/${q.perType}</b></div>`).join('')}</div>`, confirm: 'confirm-upgrade:' + floorNo, confirmDisabled: !can };
    },
    part: (type, tier) => ({ title: D.partNames[type], html: `<div class="center">${partImg(type)}<h3>${t(D.partNames[type])} · ${t(D.tiers[tier])}</h3></div>${summaryRow(t('class'), t('moduleClass' + (tier + 1)))}${summaryRow(t('yourInventory'), E.partCount(type, tier))}` }),
    reviewStake: (days, amount) => {
      const plan = D.stakingPlans.find((p) => p.days === days);
      return { title: 'reviewStake', html: summaryRow(t('amount'), n(amount, 2) + ' COIN') + summaryRow(t('duration'), days + ' ' + t('days')) + summaryRow(t('estimatedReward'), '+' + n(amount * plan.percent / 100, 2) + ' COIN') + summaryRow(t('totalMaturity'), n(amount * (1 + plan.percent / 100), 2) + ' COIN', true) + `<p class="muted small" style="margin-top:10px">${t('lockedUntil')}</p>`, confirm: 'confirm-stake:' + days + ':' + amount };
    },
    confirmWithdraw: () => {
      const ui = global.APP.ui, gross = Number(ui.withdrawAmount) || 0;
      return { title: 'confirmWithdrawal', html: summaryRow(t('requested'), n(gross, 2) + ' COIN') + summaryRow(t('serviceFee') + ' 5%', '-' + n(gross * 0.05, 2)) + summaryRow(t('total'), n(gross * 0.95, 2) + ' COIN', true) + `<p class="muted small" style="margin-top:10px">${t('reviewDetails')}</p>`, confirm: 'confirm-withdraw-final' };
    },
    levelDetail: (value) => {
      const x = D.levels[value - 1]; if (!x) return null;
      const league = D.leagueOf(value);
      return { title: 'levelPreview', html: `<div class="level-preview center">${medal(league.key, 60)}<h3>${t(league.key)} · ${t('level')} ${value}</h3></div>${summaryRow(t('walletHold'), n(x.hold, 0) + ' COIN')}${summaryRow(t('daily'), n(x.daily, 0) + ' COIN')}${summaryRow(t('hourly'), n(x.daily / 24, 2) + ' COIN')}${summaryRow(t('multiplier'), '×' + n(x.daily / D.baseDaily, 2))}` };
    },
    commission: (refId) => {
      const list = refId && refId !== 'all' ? S().commissions.filter((x) => x.from === refId) : S().commissions;
      return { title: 'commissionHistory', html: list.map((x) => `<div class="list-row">${B('coins', 'greenbox')}<div class="spacer"><h3>${t('commissionFrom', { name: esc(x.from) })}</h3><small class="muted">${T.fmtDateTime(x.created_ms)}</small></div><strong class="green small">+${n(x.amount, 2)}</strong></div>`).join('') || empty('commissionEmpty', 'coins') };
    },
    taskDetail: (id) => {
      const m = D.missions.find((x) => x.id === id);
      return { title: m.title, html: `<p class="muted">${t(m.desc)}</p>${summaryRow(t('reward'), '+' + n(m.reward, 0) + ' COIN')}` };
    }
  };

  global.UI = { header, bottomNav, home, mining, station, cratesPage, workshopPage, inventoryGrid,
    friends, wallet, activityPage, market, staking, tasks, leagues, levels, profile, ambassadors,
    withdraw, settings, support, admin, legal, modals, I, B, btn, navBtn, progress, summaryRow,
    empty, hero, stats, chart, medal, partImg, asset, artStyle, levelLink, miningView, balanceCard,
    levelCard, sectionTitle, shortAddr };
})(window);
