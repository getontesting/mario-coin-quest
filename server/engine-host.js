'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const config = require('./config');
const store = require('./store');

const DATA_SOURCE = fs.readFileSync(path.join(config.root, 'js', 'data.js'), 'utf8');
const ENGINE_SOURCE = fs.readFileSync(path.join(config.root, 'js', 'engine.js'), 'utf8');
const STATE_KEY = 'rifty_state_v2';
const hosts = new Map();

function makeHost(uid) {
  const sandbox = {
    console,
    URLSearchParams,
    setTimeout,
    clearTimeout,
    location: { search: '', hash: '' },
    navigator: { language: 'en' },
    I18N: { raw: (k) => k, t: (k) => k },
    localStorage: {
      getItem(key) {
        if (key !== STATE_KEY) return null;
        const s = store.getState(uid);
        return s ? JSON.stringify(s) : null;
      },
      setItem(key, value) {
        if (key !== STATE_KEY) return;
        try { store.saveState(uid, JSON.parse(value)); } catch (e) { console.error('state save', e); }
      },
      removeItem(key) { if (key === STATE_KEY) store.saveState(uid, null); }
    }
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(DATA_SOURCE, sandbox, { filename: 'data.js' });
  vm.runInContext(ENGINE_SOURCE, sandbox, { filename: 'engine.js' });
  if (!sandbox.ENGINE) throw new Error('ENGINE_NOT_LOADED');
  sandbox.ENGINE.__sandbox = sandbox;
  return sandbox.ENGINE;
}

function host(uid) {
  if (!hosts.has(String(uid))) hosts.set(String(uid), makeHost(uid));
  return hosts.get(String(uid));
}

function bootstrap(uid, tgUser) {
  const engine = host(uid);
  let state = store.getState(uid);
  if (!state) {
    state = engine.load(tgUser || { id: uid, first_name: 'Explorer' });
    store.saveState(uid, state);
  } else {
    engine.setState(state);
  }
  engine.tick();
  return store.getState(uid);
}

function action(uid, name, args = []) {
  const engine = host(uid);
  engine.setState(store.getState(uid));
  engine.tick();
  const fn = engine.actions[name];
  if (typeof fn !== 'function') throw new Error('err_invalid_parameters');
  if (engine.__sandbox) engine.__sandbox.__SERVER_ADMIN__ = /^admin/i.test(name);
  const result = fn(...(Array.isArray(args) ? args : []));
  return Promise.resolve(result).then((r) => {
    if (engine.__sandbox) engine.__sandbox.__SERVER_ADMIN__ = false;
    return {
      ok: !!r && r.ok !== false,
      data: r?.data || null,
      error: r?.error || null,
      state: store.getState(uid)
    };
  });
}

function tick(uid) {
  const engine = host(uid);
  engine.setState(store.getState(uid));
  engine.tick();
  return store.getState(uid);
}

module.exports = { bootstrap, action, tick, host };
