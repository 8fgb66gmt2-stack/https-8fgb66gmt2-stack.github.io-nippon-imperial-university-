/* NIU PLAYER STORAGE — compatibility bridge
 *
 * Player-specific localStorage namespacing is owned by profile-slots.js.
 * This file intentionally does NOT monkey-patch Storage.prototype. Older
 * versions did so and conflicted with profile-slots.js when both scripts
 * were loaded, causing nested namespaces and lost entrant state.
 */
(function () {
  'use strict';

  if (window.__NIU_PLAYER_STORAGE_BRIDGE__) return;
  window.__NIU_PLAYER_STORAGE_BRIDGE__ = true;

  const CURRENT = 'niu_current_player';
  const nativeGet = Storage.prototype.getItem;
  const nativeSet = Storage.prototype.setItem;
  const nativeRemove = Storage.prototype.removeItem;

  function cleanName(value) {
    return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 48);
  }

  function rawGet(key) {
    return nativeGet.call(window.localStorage, key);
  }

  function rawSet(key, value) {
    nativeSet.call(window.localStorage, key, String(value));
  }

  function rawRemove(key) {
    nativeRemove.call(window.localStorage, key);
  }

  function currentName() {
    return cleanName(
      rawGet(CURRENT) ||
      rawGet('niu_entrant_name') ||
      rawGet('argVisitor') ||
      ''
    );
  }

  function setCurrentName(value) {
    const name = cleanName(value);
    if (!name) {
      rawRemove(CURRENT);
      return null;
    }
    rawSet(CURRENT, name);
    return name;
  }

  window.NIUPlayerStorage = {
    getCurrentPlayer: function () {
      const api = window.NIUProfiles;
      if (api && typeof api.current === 'function') {
        const name = cleanName(api.current());
        return name ? { name: name } : null;
      }
      const name = currentName();
      return name ? { name: name } : null;
    },

    setCurrentPlayer: function (name) {
      const clean = cleanName(name);
      const api = window.NIUProfiles;
      if (api && typeof api.activate === 'function') {
        api.activate(clean);
      } else {
        setCurrentName(clean);
      }
      return this.getCurrentPlayer();
    },

    unlockAchievement: function (number) {
      window.localStorage.setItem(
        'achievement_' + String(number).padStart(2, '0'),
        'unlocked'
      );
    },

    hasAchievement: function (number) {
      const key = 'achievement_' + String(number).padStart(2, '0');
      return window.localStorage.getItem(key) === 'unlocked' ||
             window.localStorage.getItem('achievement' + number) === 'true';
    }
  };

  /* Migrate the old global entrant alias once. */
  if (!rawGet('niu_entrant_name') && rawGet('argVisitor')) {
    setCurrentName(rawGet('argVisitor'));
  }
})();
