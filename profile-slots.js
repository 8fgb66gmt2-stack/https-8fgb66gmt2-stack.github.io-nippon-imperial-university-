/* N.I.U. / PLAYER PROFILE SLOTS */
(function(){
  'use strict';
  const GLOBAL = new Set(['niu_entrant_name','niu_active_profile','niu_profiles_version']);
  const VERSION = '2';
  const PREFIX = 'niu_profile_v2::';
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
    if(native.getItem.call(window.localStorage,'niu_profiles_version') === VERSION) return;
    const name = cleanName(native.getItem.call(window.localStorage,'niu_entrant_name'));
    if(name){
      native.setItem.call(window.localStorage,'niu_active_profile',name);
      const keys=[];
      for(let i=0;i<nativeLength.call(window.localStorage);i++){
        const k=native.key.call(window.localStorage,i);
        if(k && !GLOBAL.has(k) && !k.startsWith(PREFIX)) keys.push(k);
      }
      keys.forEach(k=>{
        const v=native.getItem.call(window.localStorage,k);
        native.setItem.call(window.localStorage, PREFIX+encodeURIComponent(name)+'::'+k, v);
        native.removeItem.call(window.localStorage,k);
      });
    }
    native.setItem.call(window.localStorage,'niu_profiles_version',VERSION);
  }
  migrateLegacy();
  Storage.prototype.getItem=function(k){ return native.getItem.call(this,scoped(String(k))); };
  Storage.prototype.setItem=function(k,v){ return native.setItem.call(this,scoped(String(k)),String(v)); };
  Storage.prototype.removeItem=function(k){ return native.removeItem.call(this,scoped(String(k))); };
  Storage.prototype.clear=function(){
    const remove=[];
    for(let i=0;i<nativeLength.call(this);i++){
      const k=native.key.call(this,i);
      if(k && k.startsWith(PREFIX+encodeURIComponent(active())+'::')) remove.push(k);
    }
    remove.forEach(k=>native.removeItem.call(this,k));
  };
  Storage.prototype.key=function(index){
    const globals=[]; const mine=[];
    for(let i=0;i<nativeLength.call(this);i++){
      const k=native.key.call(this,i); if(!k) continue;
      if(GLOBAL.has(k)) globals.push(k);
      else if(k.startsWith(PREFIX+encodeURIComponent(active())+'::')) mine.push(k.slice((PREFIX+encodeURIComponent(active())+'::').length));
    }
    const all=globals.concat(mine); return all[index] ?? null;
  };
  Object.defineProperty(Storage.prototype,'length',{configurable:true,get:function(){
    let n=0;
    for(let i=0;i<nativeLength.call(window.localStorage);i++){
      const k=native.key.call(window.localStorage,i);
      if(k && (GLOBAL.has(k)||k.startsWith(PREFIX+encodeURIComponent(active())+'::'))) n++;
    }
    return n;
  }});
  window.NIUProfiles={
    activate:function(name){
      name=cleanName(name); if(!name) return false;
      native.setItem.call(window.localStorage,'niu_active_profile',name);
      native.setItem.call(window.localStorage,'niu_entrant_name',name);
      return true;
    },
    current:function(){return active();},
    reset:function(name){
      const old=active(); if(name) native.setItem.call(window.localStorage,'niu_active_profile',cleanName(name));
      const target=active(); const p=PREFIX+encodeURIComponent(target)+'::';
      const remove=[]; for(let i=0;i<nativeLength.call(window.localStorage);i++){const k=native.key.call(window.localStorage,i);if(k&&k.startsWith(p))remove.push(k);} remove.forEach(k=>native.removeItem.call(window.localStorage,k));
      native.setItem.call(window.localStorage,'niu_entrant_name',target); native.setItem.call(window.localStorage,'niu_active_profile',target);
      return {previous:old,current:target};
    }
  };
})();
