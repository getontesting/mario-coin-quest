/* Mario Bros: Coin Quest - static game configuration (mirrors the reference app constants) */
(function (global) {
  'use strict';

  const HERO = {
    'admin-hero': 'mario-leagues.svg', 'ambassadors-hero': 'mario-leagues.svg',
    'crafting-hero': 'mario-station.svg', 'crates-hero': 'mario-crates.svg',
    'friends-hero': 'mario-friends.svg', 'home-hero': 'mario-home.svg',
    'leagues-hero': 'mario-leagues.svg', 'market-hero': 'mario-coins.svg',
    'mining-hero': 'mario-mining.svg', 'privacy-hero': 'mario-home.svg',
    'profile-hero': 'mario-home.svg', 'settings-hero': 'mario-home.svg',
    'staking-hero': 'mario-coins.svg', 'station-hero': 'mario-station.svg',
    'support-hero': 'mario-home.svg', 'task-daily-hero': 'mario-tasks.svg',
    'tasks-hero': 'mario-tasks.svg', 'terms-hero': 'mario-home.svg',
    'wallet-hero': 'mario-coins.svg', 'withdraw-hero': 'mario-coins.svg'
  };
  const media = {
    logo: 'assets/mario-logo.svg',
    chip: 'assets/mario-part-chip.svg', power: 'assets/mario-part-power.svg',
    cooler: 'assets/mario-part-cooler.svg', crystal: 'assets/mario-part-crystal.svg',
    'crate-basic': 'assets/mario-crate-small.svg', 'crate-medium': 'assets/mario-crate-medium.svg',
    'crate-large': 'assets/mario-crate-large.svg', 'crate-epic': 'assets/mario-crate-mega.svg',
    'crate-cpu': 'assets/mario-crate-cpu.svg', 'crate-power': 'assets/mario-crate-power.svg',
    'crate-quantum': 'assets/mario-crate-quantum.svg', 'crate-rare': 'assets/mario-crate-rare.svg',
    'medal-bronze': 'assets/mario-medal-bronze.svg', 'medal-silver': 'assets/mario-medal-silver.svg',
    'medal-gold': 'assets/mario-medal-gold.svg', 'medal-platinum': 'assets/mario-medal-platinum.svg',
    'medal-legendary': 'assets/mario-medal-legendary.svg',
    'task-achievement': 'assets/mario-task-achievement.svg', 'task-holding': 'assets/mario-task-holding.svg',
    'task-operations': 'assets/mario-task-operations.svg', 'task-referrals': 'assets/mario-task-referrals.svg',
    'task-social': 'assets/mario-task-social.svg', 'task-streak': 'assets/mario-task-streak.svg',
    'profile-avatar': 'assets/mario-profile-avatar.svg',
    ...Object.fromEntries(Object.entries(HERO).map(([k, v]) => [k, 'assets/' + v]))
  };

  const assetUrl = (name) => media[name] || 'assets/mario-' + name + '.svg';

  const leagues = [
    { key: 'bronze', from: 1, to: 100 },
    { key: 'silver', from: 101, to: 200 },
    { key: 'gold', from: 201, to: 300 },
    { key: 'platinum', from: 301, to: 400 },
    { key: 'legendary', from: 401, to: 500 }
  ];

  // 500 levels. Level 2 requires 116 COIN on-chain; each level asks ~16% more.
  const levelHold = (level) => (level <= 1 ? 0 : Math.round(116 * Math.pow(1.16, level - 2)));
  const levelDaily = (level) => Math.round(600 * Math.pow(1.045, level - 1));
  const levels = Array.from({ length: 500 }, (_, i) => {
    const level = i + 1;
    return { level, hold: levelHold(level), daily: levelDaily(level) };
  });
  const leagueOf = (level) => leagues.find((l) => level >= l.from && level <= l.to) || leagues[0];

  const tiers = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  const tierClasses = ['spark', 'pulse', 'prism', 'nova', 'nexus'];
  const partNames = { 1: 'chip', 2: 'power', 3: 'cooler', 4: 'crystal' };
  const partImages = { 1: 'chip', 2: 'power', 3: 'cooler', 4: 'crystal' };
  const classLabel = (tier) => t('moduleClass' + (tier + 1));

  const sectors = [
    { key: 'compute', from: 1, to: 20, tier: 0, perSlot: 1 },
    { key: 'energy', from: 21, to: 40, tier: 1, perSlot: 2 },
    { key: 'cooling', from: 41, to: 60, tier: 2, perSlot: 3 },
    { key: 'quantum', from: 61, to: 80, tier: 3, perSlot: 4 },
    { key: 'mario', from: 81, to: 100, tier: 4, perSlot: 5 }
  ];

  const floorIncome = (floor, tier) => Math.round((12 + floor * 3) * Math.pow(1.6, tier));
  const upgradeQuote = (floor, tier, rank) => {
    if (rank >= 5) return null;
    const perType = Math.min(12, tier + 1 + rank);
    return {
      rank: rank + 1,
      tier,
      perType,
      totalParts: perType * 4,
      cost: Math.round(500 * (tier + 1) * Math.pow(1.8, rank)),
      dailyLimit: 8,
      income: floorIncome(floor, Math.min(4, tier + (rank === 4 ? 1 : 0)))
    };
  };

  const crates = {
    small: { key: 'small', name: 'small', badge: 'STARTER', image: 'crate-basic', price: 500, count: 1, limit: 50, guaranteed: 0, filter: 'standard', desc: 'crateDesc_small', odds: [82, 15, 3, 0, 0] },
    medium: { key: 'medium', name: 'medium', badge: 'BALANCED', image: 'crate-medium', price: 1500, count: 2, limit: 30, guaranteed: 0, filter: 'standard', desc: 'crateDesc_medium', odds: [55, 30, 12, 3, 0] },
    big: { key: 'big', name: 'big', badge: 'ADVANCED', image: 'crate-large', price: 4500, count: 7, limit: 15, guaranteed: 0, filter: 'standard', desc: 'crateDesc_big', odds: [35, 32, 22, 9, 2] },
    mega: { key: 'mega', name: 'mega', badge: 'PREMIUM', image: 'crate-epic', price: 14000, count: 10, limit: 6, guaranteed: 3, filter: 'standard', desc: 'crateDesc_mega', odds: [10, 22, 35, 24, 9] },
    cpu_pack: { key: 'cpu_pack', name: 'cpu_pack', badge: 'CPU', image: 'crate-cpu', price: 3200, count: 3, limit: 8, guaranteed: 0, onlyType: 1, filter: 'special', desc: 'crateDesc_cpu_pack', odds: [50, 30, 15, 4, 1] },
    power_pack: { key: 'power_pack', name: 'power_pack', badge: 'POWER', image: 'crate-power', price: 3200, count: 3, limit: 8, guaranteed: 0, onlyType: 2, filter: 'special', desc: 'crateDesc_power_pack', odds: [50, 30, 15, 4, 1] },
    quantum: { key: 'quantum', name: 'quantum', badge: 'ELITE', image: 'crate-quantum', price: 40000, count: 5, limit: 2, guaranteed: 2, filter: 'special', desc: 'crateDesc_quantum', odds: [0, 0, 40, 40, 20] }
  };

  const stakingPlans = [
    { days: 7, percent: 6 },
    { days: 30, percent: 30 },
    { days: 90, percent: 120 }
  ];

  const missions = [
    { id: 'checkin', cat: 'daily', title: 'task_checkin', desc: 'missionDesc_checkin', icon: 'task-streak', reward: 500, cooldown: 24, kind: 'declared' },
    { id: 'mining_daily', cat: 'daily', title: 'task_mining_daily', desc: 'missionDesc_mining_daily', icon: 'task-operations', reward: 1500, cooldown: 24, kind: 'auto' },
    { id: 'workshop_daily', cat: 'daily', title: 'task_workshop_daily', desc: 'missionDesc_workshop_daily', icon: 'task-achievement', reward: 1500, cooldown: 24, kind: 'auto' },
    { id: 'telegram_daily', cat: 'daily', title: 'task_telegram_daily', desc: 'missionTelegramDesc', icon: 'task-social', reward: 1200, cooldown: 24, kind: 'telegram' },
    { id: 'x_post', cat: 'social', title: 'task_x_post', desc: 'missionTelegramDesc', icon: 'task-social', reward: 2500, cooldown: 72, kind: 'declared', url: 'https://x.com/intent/tweet?text=Mario Bros%20Mining' },
    { id: 'x_follow', cat: 'social', title: 'task_x_follow', desc: 'missionTelegramDesc', icon: 'task-social', reward: 2000, cooldown: 168, kind: 'declared', url: 'https://x.com/' },
    { id: 'community_react', cat: 'social', title: 'task_community_react', desc: 'missionTelegramDesc', icon: 'task-social', reward: 1200, cooldown: 168, kind: 'declared', url: 'https://t.me/' },
    { id: 'channel', cat: 'social', title: 'task_channel', desc: 'missionTelegramDesc', icon: 'task-social', reward: 3000, cooldown: 0, kind: 'telegram', once: true },
    { id: 'refs3', cat: 'milestones', title: 'task_refs3', desc: 'missionDesc_refs3', icon: 'task-referrals', reward: 5000, cooldown: 0, kind: 'auto', once: true, need: { refs: 3 } },
    { id: 'refs20', cat: 'milestones', title: 'task_refs20', desc: 'missionDesc_refs20', icon: 'task-referrals', reward: 25000, cooldown: 0, kind: 'auto', once: true, need: { refs: 20 } },
    { id: 'refs100', cat: 'milestones', title: 'task_refs100', desc: 'missionDesc_refs100', icon: 'task-referrals', reward: 150000, cooldown: 0, kind: 'auto', once: true, need: { refs: 100 } },
    { id: 'stake', cat: 'milestones', title: 'task_stake', desc: 'missionDesc_stake', icon: 'task-holding', reward: 12000, cooldown: 0, kind: 'auto', once: true, need: { staked: 50000 } },
    { id: 'first_stake', cat: 'milestones', title: 'task_first_stake', desc: 'missionDesc_first_stake', icon: 'task-holding', reward: 1000, cooldown: 0, kind: 'auto', once: true, need: { stakes: 1 } },
    { id: 'tower', cat: 'milestones', title: 'task_tower', desc: 'missionDesc_tower', icon: 'task-operations', reward: 5000, cooldown: 0, kind: 'auto', once: true, need: { floor: 1 } },
    { id: 'level', cat: 'milestones', title: 'task_level', desc: 'missionDesc_level', icon: 'task-achievement', reward: 3000, cooldown: 0, kind: 'auto', once: true, need: { level: 2 } },
    { id: 'hold', cat: 'holding', title: 'missionHoldTitle', desc: 'missionHoldDesc', icon: 'task-holding', reward: 4000, cooldown: 24, kind: 'auto', amount: 116 }
  ];

  const ambassadorTiers = [
    { name: 'communityPartner', percent: 5, refs: 10, subs: 200 },
    { name: 'bronze', percent: 10, refs: 25, subs: 500 },
    { name: 'silver', percent: 15, refs: 50, subs: 1000 },
    { name: 'gold', percent: 20, refs: 75, subs: 1500 },
    { name: 'platinum', percent: 25, refs: 100, subs: 2000 }
  ];

  const botName = 'mariocoinbot';
  const inviteLink = (userId) => `https://t.me/${botName}?startapp=ref_${encodeURIComponent(userId)}`;

  global.DATA = {
    media, assetUrl, leagues, levels, levelHold, levelDaily, leagueOf,
    tiers, tierClasses, partNames, partImages, classLabel, sectors,
    floorIncome, upgradeQuote, crates, stakingPlans, missions, ambassadorTiers,
    botName, inviteLink,
    baseDaily: 600, // 25 COIN/hour at level 1
    miningPauseHours: 12,
    boostMultiplier: 1.5,
    boostHours: 1,
    marketPrice: 0.0000042,
    serviceFee: 0.05,
    slippage: 0.005,
    withdrawMinimum: 10000,
    withdrawFee: 0.05,
    withdrawHoldPct: 0.25,
    withdrawCooldownHours: 24,
    activeFriendHold: 116,
    streakDays: 30,
    synthesisFee: 0.02,
    maxFloors: 100
  };
})(window);
