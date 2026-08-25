/* N.I.U. / PLAYER PROFILE SLOTS — V9
   One browser may host many players. Game state is isolated by entrant name.
   V9 fixes duplicate script loading, nested localStorage prefixes, and mobile
   archive controls appearing over the entrant registration screen.
*/
(function(){
  'use strict';

  /* index.html currently contains several historical profile-slots.js tags.
     Only the first execution is allowed to patch Storage.prototype. */
  if(window.__NIU_PROFILE_SLOTS_V9__) return;
  window.__NIU_PROFILE_SLOTS_V9__ = true;

  const GLOBAL = new Set(['niu_entrant_name','niu_active_profile','niu_profiles_version']);
  const VERSION = '9';
  const PREFIX = 'niu_profile_v8::';
  const native = {
    getItem: Storage.prototype.getItem,
    setItem: Storage.prototype.setItem,
    removeItem: Storage.prototype.removeItem,
    clear: Storage.prototype.clear,
    key: Storage.prototype.key
  };
  const nativeLength = Object.getOwnPropertyDescriptor(Storage.prototype,'length').get;

  function cleanName(v){
    return String(v||'').trim().replace(/[\\/:*?"<>|]/g,'').replace(/\s+/g,' ').slice(0,40);
  }
  function raw(k){return native.getItem.call(window.localStorage,k);}
  function rawSet(k,v){native.setItem.call(window.localStorage,k,String(v));}
  function active(){return cleanName(raw('niu_active_profile'))||cleanName(raw('niu_entrant_name'))||'';}
  function scoped(k){
    k=String(k);
    if(GLOBAL.has(k)||!active()) return k;
    return PREFIX+encodeURIComponent(active())+'::'+k;
  }
  function activate(name){
    name=cleanName(name);
    if(!name) return false;
    const previous=active();
    rawSet('niu_entrant_name',name);
    rawSet('niu_active_profile',name);
    rawSet('niu_profiles_version',VERSION);
    if(previous!==name){
      window.dispatchEvent(new CustomEvent('niu:profile-changed',{detail:{previous,current:name}}));
    }
    return true;
  }

  /* Migrate values accidentally nested by the previous duplicate bootstrap.
     Example: v8::name::v8::name::niu_arg2_found -> v8::name::niu_arg2_found */
  function migrateNestedProfileKeys(){
    const name=active();
    if(!name) return;
    const base=PREFIX+encodeURIComponent(name)+'::';
    const nested=base+base;
    const copy=[];
    for(let i=0;i<nativeLength.call(window.localStorage);i++){
      const k=native.key.call(window.localStorage,i);
      if(k && k.startsWith(nested)) copy.push(k);
    }
    copy.forEach(k=>{
      const target=base+k.slice(nested.length);
      const value=native.getItem.call(window.localStorage,k);
      if(value!==null && native.getItem.call(window.localStorage,target)===null){
        native.setItem.call(window.localStorage,target,value);
      }
    });
  }

  if(cleanName(raw('niu_entrant_name'))) rawSet('niu_active_profile',cleanName(raw('niu_entrant_name')));
  rawSet('niu_profiles_version',VERSION);
  migrateNestedProfileKeys();

  Storage.prototype.getItem=function(k){return native.getItem.call(this,scoped(k));};
  Storage.prototype.setItem=function(k,v){
    k=String(k);
    if(k==='niu_entrant_name') return activate(v);
    return native.setItem.call(this,scoped(k),String(v));
  };
  Storage.prototype.removeItem=function(k){return native.removeItem.call(this,scoped(k));};
  Storage.prototype.clear=function(){
    const a=active();
    if(!a) return;
    const prefix=PREFIX+encodeURIComponent(a)+'::';
    const remove=[];
    for(let i=0;i<nativeLength.call(this);i++){
      const k=native.key.call(this,i);
      if(k&&k.startsWith(prefix)) remove.push(k);
    }
    remove.forEach(k=>native.removeItem.call(this,k));
  };
  Storage.prototype.key=function(index){
    const a=active(),prefix=a?PREFIX+encodeURIComponent(a)+'::':'';
    const list=[];
    for(let i=0;i<nativeLength.call(this);i++){
      const k=native.key.call(this,i);
      if(!k) continue;
      if(GLOBAL.has(k)) list.push(k);
      else if(prefix&&k.startsWith(prefix)) list.push(k.slice(prefix.length));
    }
    return list[index]??null;
  };
  Object.defineProperty(Storage.prototype,'length',{
    configurable:true,
    get:function(){
      const a=active(),prefix=a?PREFIX+encodeURIComponent(a)+'::':'';
      let n=0;
      for(let i=0;i<nativeLength.call(this);i++){
        const k=native.key.call(this,i);
        if(k&&(GLOBAL.has(k)||(prefix&&k.startsWith(prefix)))) n++;
      }
      return n;
    }
  });

  window.NIUProfiles={activate,current:active,cleanName};

  function installMobileArchiveLayout(){
    if(document.getElementById('niu-mobile-archive-layout-fix-v4')) return;
    const style=document.createElement('style');
    style.id='niu-mobile-archive-layout-fix-v4';
    style.textContent=`
      /* Entrance screen must own the whole viewport. */
      #entrance:not(.hide) ~ #arg2-trigger,
      #entrance:not(.hide) ~ a[href="shiryo-shitsu.html"],
      #entrance:not(.hide) ~ a[href="archive16.html"]{
        display:none !important;
        pointer-events:none !important;
      }
      #entrance{z-index:100000 !important;}
      @media (max-width:760px){
        #arg2-trigger{
          position:fixed !important;
          left:10px !important;
          right:10px !important;
          bottom:240px !important;
          width:auto !important;
          min-height:44px !important;
          z-index:10003 !important;
          transform:none !important;
          pointer-events:auto !important;
          touch-action:manipulation !important;
        }
        a[href="shiryo-shitsu.html"]{
          position:fixed !important;
          left:10px !important;
          right:10px !important;
          bottom:180px !important;
          width:auto !important;
          min-height:44px !important;
          z-index:10002 !important;
          transform:none !important;
          pointer-events:auto !important;
          touch-action:manipulation !important;
        }
        a[href="archive16.html"]{
          position:fixed !important;
          left:10px !important;
          right:10px !important;
          bottom:120px !important;
          width:auto !important;
          min-height:44px !important;
          z-index:10001 !important;
          transform:none !important;
          pointer-events:auto !important;
          touch-action:manipulation !important;
        }
        body{padding-bottom:300px !important;}
      }
      @media (max-width:380px){
        #arg2-trigger{bottom:250px !important;}
        a[href="shiryo-shitsu.html"]{bottom:188px !important;}
        a[href="archive16.html"]{bottom:126px !important;}
      }
    `;
    (document.head||document.documentElement).appendChild(style);
  }

  function installEntranceBehavior(){
    const entrance=document.getElementById('entrance');
    const enter=document.getElementById('enterButton');
    if(!entrance) return;
    const revealControls=()=>{
      entrance.classList.add('hide');
      document.body.classList.remove('niu-entrance-active');
    };
    if(enter) enter.addEventListener('click',revealControls,{capture:false});
  }

  document.addEventListener('DOMContentLoaded',function(){
    const input=document.getElementById('entrant-name');
    if(input){
      const saved=raw('niu_entrant_name');
      if(saved) input.value=saved;
      input.addEventListener('change',function(){
        const value=cleanName(this.value);
        if(value) activate(value);
      });
      input.addEventListener('input',function(){
        const value=cleanName(this.value);
        if(value) activate(value);
      });
    }
    installMobileArchiveLayout();
    installEntranceBehavior();

    /* Do not replace the site's original ARG2 click handler. We only ensure
       that iOS treats the control as a normal tappable control. */
    const trigger=document.getElementById('arg2-trigger');
    if(trigger){
      trigger.style.pointerEvents='auto';
      trigger.style.touchAction='manipulation';
    }
  });
})();