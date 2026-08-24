/* NIU PLAYER STORAGE v1
 * All ARG progress is isolated by the currently registered entrant name.
 * Legacy achievement/stage keys are transparently namespaced so old pages
 * continue to work without sharing progress between players on one device.
 */
(function () {
  'use strict';
  if (window.__NIU_PLAYER_STORAGE__) return;
  window.__NIU_PLAYER_STORAGE__ = true;

  const RAW = Storage.prototype;
  const CURRENT = 'niu_current_player';
  const NAME_KEYS = new Set(['niu_entrant_name', 'argVisitor']);
  const GLOBAL_KEYS = new Set([CURRENT, 'niu_players_v1']);
  const EXEMPT = new Set(['theme', 'fontSize', 'darkMode']);

  function cleanName(v) {
    return String(v || '').trim().replace(/\\s+/g, ' ').slice(0, 48);
  }
  function playerName() {
    return cleanName(RAW.getItem.call(localStorage, CURRENT) || RAW.getItem.call(localStorage, 'niu_entrant_name') || RAW.getItem.call(localStorage, 'argVisitor'));
  }
  function playerId(name) {
    let h = 2166136261;
    for (let i = 0; i < name.length; i++) { h ^= name.charCodeAt(i); h = Math.imul(h, 16777619); }
    return ('00000000' + (h >>> 0).toString(16)).slice(-8);
  }
  function ns(name) { return 'niu:p:' + playerId(name) + ':'; }
  function isPlayerData(key) {
    return !GLOBAL_KEYS.has(key) && !NAME_KEYS.has(key) && !EXEMPT.has(key);
  }
  function scoped(key) {
    const name = playerName();
    return name && isPlayerData(key) ? ns(name) + key : key;
  }

  function setCurrentName(value) {
    const name = cleanName(value);
    if (name) {
      RAW.setItem.call(localStorage, CURRENT, name);
      const players = JSON.parse(RAW.getItem.call(localStorage, 'niu_players_v1') || '{}');
      players[name] = { name: name, lastSeen: new Date().toISOString() };
      RAW.setItem.call(localStorage, 'niu_players_v1', JSON.stringify(players));
    } else {
      RAW.removeItem.call(localStorage, CURRENT);
    }
  }

  Storage.prototype.getItem = function (key) {
    key = String(key);
    if (NAME_KEYS.has(key)) {
      const current = playerName();
      if (key === 'niu_entrant_name') return current || null;
      return current || null;
    }
    return RAW.getItem.call(this, scoped(key));
  };

  Storage.prototype.setItem = function (key, value) {
    key = String(key);
    if (NAME_KEYS.has(key)) {
      setCurrentName(value);
      return;
    }
    return RAW.setItem.call(this, scoped(key), String(value));
  };

  Storage.prototype.removeItem = function (key) {
    key = String(key);
    if (NAME_KEYS.has(key)) {
      RAW.removeItem.call(this, CURRENT);
      return;
    }
    return RAW.removeItem.call(this, scoped(key));
  };

  Storage.prototype.key = function (index) {
    const keys = [];
    for (let i = 0; i < RAW.length.call(this); i++) {
      const k = RAW.key.call(this, i);
      if (!k || k.indexOf(ns(playerName())) !== 0) continue;
      keys.push(k.slice(ns(playerName()).length));
    }
    return keys[index] || null;
  };

  Object.defineProperty(Storage.prototype, 'length', {
    configurable: true,
    get: function () {
      const prefix = ns(playerName());
      let count = 0;
      for (let i = 0; i < RAW.length.call(this); i++) {
        const k = RAW.key.call(this, i);
        if (k && k.indexOf(prefix) === 0) count++;
      }
      return count;
    }
  });

  window.NIUProfiles = {
    getCurrentPlayer: function () { const n = playerName(); return n ? { id: playerId(n), name: n } : null; },
    setCurrentPlayer: function (name) { setCurrentName(name); return this.getCurrentPlayer(); },
    unlockAchievement: function (n) { localStorage.setItem('achievement_' + String(n).padStart(2, '0'), 'unlocked'); },
    hasAchievement: function (n) { return localStorage.getItem('achievement_' + String(n).padStart(2, '0')) === 'unlocked' || localStorage.getItem('achievement' + n) === 'true'; }
  };
})();
