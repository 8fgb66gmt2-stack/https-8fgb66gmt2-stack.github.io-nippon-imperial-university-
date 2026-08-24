/* N.I.U. / PLAYER PROFILE SLOTS — V5
   Player progress is separated by entrant name.
   Browser localStorage is still the physical storage, but every game-state key
   is transparently namespaced by the current player profile.
*/
(function(){
  'use strict';

  const GLOBAL = new Set(['niu_entrant_name','niu_active_profile','niu_profiles_version']);
  const VERSION = '5';
  const PREFIX = 'niu_profile_v5::';

  const nativeLength = Object.getOwnPropertyDescriptor(Storage.prototype,'length').get;
  const native = {
    getItem: Storage.prototype.getItem,
    setItem: Storage.prototype.setItem,
    removeItem: Storage.prototype.removeItem,
    clear: Storage.prototype.clear,
    key: Storage.prototype.key
  };

  function cleanName(v){
    return String(v || '').trim()
      .replace(/[\\/:*?"<>|]/g,'')
      .slice(0,40);
  }

  function raw(key){
    return native.getItem.call(window.localStorage,key);
  }

  function setRaw(key,value){
    native.setItem.call(window.localStorage,key,String(value));
  }

  function active(){
    return cleanName(raw('niu_active_profile')) || cleanName(raw('niu_entrant_name')) || 'default';
  }

  function scoped(key){
    key = String(key);
    return GLOBAL.has(key)
      ? key
      : PREFIX + encodeURIComponent(active()) + '::' + key;
  }

  /* Convert existing V4 profile data to V5 without mixing players. */
  function migrateV4(){
    const current = active();
    if(current === 'default') return;

    const oldPrefix = 'niu_profile_v4::' + encodeURIComponent(current) + '::';
    const newPrefix = PREFIX + encodeURIComponent(current) + '::';

    const copies = [];
    for(let i=0;i<nativeLength.call(window.localStorage);i++){
      const k = native.key.call(window.localStorage,i);
      if(k && k.startsWith(oldPrefix)){
        copies.push(k);
      }
    }

    copies.forEach(k=>{
      const shortKey = k.slice(oldPrefix.length);
      const destination = newPrefix + shortKey;
      if(raw(destination) === null){
        setRaw(destination, native.getItem.call(window.localStorage,k));
      }
    });
  }

  /*
     If a player name already exists, that name is the profile.
     This prevents a Chromebook/browser from silently inheriting the previous
     player's active profile merely because the device was previously used.
  */
  function synchronizeProfile(){
    const entrant = cleanName(raw('niu_entrant_name'));
    const selected = cleanName(raw('niu_active_profile'));

    if(entrant && entrant !== selected){
      setRaw('niu_active_profile',entrant);
    }

    migrateV4();
    setRaw('niu_profiles_version',VERSION);
  }

  synchronizeProfile();

  Storage.prototype.getItem = function(k){
    return native.getItem.call(this,scoped(k));
  };

  Storage.prototype.setItem = function(k,v){
    k = String(k);

    if(k === 'niu_entrant_name'){
      const name = cleanName(v);
      setRaw('niu_entrant_name',name);
      if(name) setRaw('niu_active_profile',name);
      return;
    }

    return native.setItem.call(this,scoped(k),String(v));
  };

  Storage.prototype.removeItem = function(k){
    return native.removeItem.call(this,scoped(k));
  };

  Storage.prototype.clear = function(){
    const prefix = PREFIX + encodeURIComponent(active()) + '::';
    const remove = [];

    for(let i=0;i<nativeLength.call(this);i++){
      const k = native.key.call(this,i);
      if(k && k.startsWith(prefix)) remove.push(k);
    }

    remove.forEach(k=>native.removeItem.call(this,k));
  };

  Storage.prototype.key = function(index){
    const globals = [];
    const mine = [];
    const prefix = PREFIX + encodeURIComponent(active()) + '::';

    for(let i=0;i<nativeLength.call(this);i++){
      const k = native.key.call(this,i);
      if(!k) continue;
      if(GLOBAL.has(k)) globals.push(k);
      else if(k.startsWith(prefix)) mine.push(k.slice(prefix.length));
    }

    const all = globals.concat(mine);
    return all[index] ?? null;
  };

  Object.defineProperty(Storage.prototype,'length',{
    configurable:true,
    get:function(){
      let n = 0;
      const prefix = PREFIX + encodeURIComponent(active()) + '::';

      for(let i=0;i<nativeLength.call(window.localStorage);i++){
        const k = native.key.call(window.localStorage,i);
        if(k && (GLOBAL.has(k) || k.startsWith(prefix))) n++;
      }

      return n;
    }
  });

  window.NIUProfiles = {
    activate:function(name){
      name = cleanName(name);
      if(!name) return false;
      setRaw('niu_active_profile',name);
      setRaw('niu_entrant_name',name);
      return true;
    },

    current:function(){
      return active();
    },

    reset:function(name){
      const old = active();
      if(name) setRaw('niu_active_profile',cleanName(name));

      const target = active();
      const prefix = PREFIX + encodeURIComponent(target) + '::';
      const remove = [];

      for(let i=0;i<nativeLength.call(window.localStorage);i++){
        const k = native.key.call(window.localStorage,i);
        if(k && k.startsWith(prefix)) remove.push(k);
      }

      remove.forEach(k=>native.removeItem.call(window.localStorage,k));
      setRaw('niu_entrant_name',target);
      setRaw('niu_active_profile',target);

      return {previous:old,current:target};
    }
  };
})();