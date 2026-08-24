/* N.I.U. / PLAYER PROFILE SLOTS */
(function(){
  'use strict';
  const GLOBAL = new Set(['niu_entrant_name','niu_active_profile','niu_profiles_version']);
  const VERSION = '4';
  const PREFIX = 'niu_profile_v4::';
  const nativeLength = Object.getOwnPropertyDescriptor(Storage.prototype,'length').get;
  const native = {
    getItem: Storage.prototype.getItem,
    setItem: Storage.prototype.setItem,
    removeItem: Storage.prototype.removeItem,
    clear: Storage.prototype.clear,
    key: Storage.prototype.key
  };
  function cleanName(v){ return String(v||'').trim().replace(/[\\/:*?"<>|]/g,'').slice(0,40); }
  function active(){ return cleanName(native.getItem.call(window.localStorage,'niu_active_profile')) || 'default'; }
  function scoped(k){ return GLOBAL.has(k) ? k : PREFIX + encodeURIComponent(active()) + '::' + k; }

  function migrateLegacy(){
    const oldVersion = native.getItem.call(window.localStorage,'niu_profiles_version');
    const name = cleanName(native.getItem.call(window.localStorage,'niu_entrant_name'));
    if(name && (!native.getItem.call(window.localStorage,'niu_active_profile') || oldVersion !== VERSION)){
      native.setItem.call(window.localStorage,'niu_active_profile',name);
    }
    const target = active();
    if(target !== 'default'){
      const targetPrefix = PREFIX + encodeURIComponent(target) + '::';
      const legacyV2Prefix = 'niu_profile_v2::' + encodeURIComponent(target) + '::';

      const existingV4 = new Set();
      for(let i=0;i<nativeLength.call(window.localStorage);i++){
        const k=native.key.call(window.localStorage,i);
        if(k && k.startsWith(targetPrefix)) existingV4.add(k.slice(targetPrefix.length));
      }
      const copyV2 = [];
      for(let i=0;i<nativeLength.call(window.localStorage);i++){
        const k=native.key.call(window.localStorage,i);
        if(k && k.startsWith(legacyV2Prefix)) copyV2.push(k);
      }
      copyV2.forEach(k=>{
        const shortKey = k.slice(legacyV2Prefix.length);
        if(!existingV4.has(shortKey)){
          native.setItem.call(window.localStorage,targetPrefix+shortKey,native.getItem.call(window.localStorage,k));
        }
      });

      if(oldVersion !== VERSION){
        const keys = [];
        for(let i=0;i<nativeLength.call(window.localStorage);i++){
          const k=native.key.call(window.localStorage,i);
          if(k && !GLOBAL.has(k) && !k.startsWith('niu_profile_v') && k !== 'niu_active_profile' && k !== 'niu_profiles_version') keys.push(k);
        }
        keys.forEach(k=>{
          const v=native.getItem.call(window.localStorage,k);
          native.setItem.call(window.localStorage,targetPrefix+k,v);
          native.removeItem.call(window.localStorage,k);
        });
      }
    }
    native.setItem.call(window.localStorage,'niu_profiles_version',VERSION);
  }

  migrateLegacy();

  Storage.prototype.getItem=function(k){
    return native.getItem.call(this,scoped(String(k)));
  };

  Storage.prototype.setItem=function(k,v){
    k=String(k);
    if(k === 'niu_entrant_name'){
      const name=cleanName(v);
      native.setItem.call(this,'niu_entrant_name',name);
      if(name) native.setItem.call(this,'niu_active_profile',name);
      return;
    }
    return native.setItem.call(this,scoped(k),String(v));
  };

  Storage.prototype.removeItem=function(k){
    return native.removeItem.call(this,scoped(String(k)));
  };

  Storage.prototype.clear=function(){
    const prefix=PREFIX+encodeURIComponent(active())+'::';
    const remove=[];
    for(let i=0;i<nativeLength.call(this);i++){
      const k=native.key.call(this,i);
      if(k && k.startsWith(prefix)) remove.push(k);
    }
    remove.forEach(k=>native.removeItem.call(this,k));
  };

  Storage.prototype.key=function(index){
    const globals=[]; const mine=[];
    const prefix=PREFIX+encodeURIComponent(active())+'::';
    for(let i=0;i<nativeLength.call(this);i++){
      const k=native.key.call(this,i);
      if(!k) continue;
      if(GLOBAL.has(k)) globals.push(k);
      else if(k.startsWith(prefix)) mine.push(k.slice(prefix.length));
    }
    const all=globals.concat(mine);
    return all[index] ?? null;
  };

  Object.defineProperty(Storage.prototype,'length',{
    configurable:true,
    get:function(){
      let n=0;
      const prefix=PREFIX+encodeURIComponent(active())+'::';
      for(let i=0;i<nativeLength.call(window.localStorage);i++){
        const k=native.key.call(window.localStorage,i);
        if(k && (GLOBAL.has(k)||k.startsWith(prefix))) n++;
      }
      return n;
    }
  });

  window.NIUProfiles={
    activate:function(name){
      name=cleanName(name); if(!name) return false;
      native.setItem.call(window.localStorage,'niu_active_profile',name);
      native.setItem.call(window.localStorage,'niu_entrant_name',name);
      return true;
    },
    current:function(){return active();},
    reset:function(name){
      const old=active();
      if(name) native.setItem.call(window.localStorage,'niu_active_profile',cleanName(name));
      const target=active();
      const p=PREFIX+encodeURIComponent(target)+'::';
      const remove=[];
      for(let i=0;i<nativeLength.call(window.localStorage);i++){
        const k=native.key.call(window.localStorage,i);
        if(k&&k.startsWith(p)) remove.push(k);
      }
      remove.forEach(k=>native.removeItem.call(window.localStorage,k));
      native.setItem.call(window.localStorage,'niu_entrant_name',target);
      native.setItem.call(window.localStorage,'niu_active_profile',target);
      return {previous:old,current:target};
    }
  };
})();
