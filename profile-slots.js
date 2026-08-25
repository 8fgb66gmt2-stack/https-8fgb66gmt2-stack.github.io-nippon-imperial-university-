/* N.I.U. / PLAYER PROFILE SLOTS — V11
   Owns player-specific localStorage namespacing.
   Includes migration from the older player-storage namespace.
*/
(function(){
  'use strict';
  if(window.__NIU_PROFILE_SLOTS_V11__) return;
  window.__NIU_PROFILE_SLOTS_V11__ = true;

  const GLOBAL=new Set(['niu_entrant_name','niu_active_profile','niu_profiles_version']);
  const VERSION='11';
  const PREFIX='niu_profile_v8::';
  const native={getItem:Storage.prototype.getItem,setItem:Storage.prototype.setItem,removeItem:Storage.prototype.removeItem,clear:Storage.prototype.clear,key:Storage.prototype.key};
  const nativeLength=Object.getOwnPropertyDescriptor(Storage.prototype,'length').get;
  const cleanName=v=>String(v||'').trim().replace(/[\\/:*?"<>|]/g,'').replace(/\s+/g,' ').slice(0,40);
  const raw=k=>native.getItem.call(window.localStorage,k);
  const rawSet=(k,v)=>native.setItem.call(window.localStorage,k,String(v));
  const active=()=>cleanName(raw('niu_active_profile'))||cleanName(raw('niu_entrant_name'))||'';
  const scoped=k=>{k=String(k);if(GLOBAL.has(k)||!active())return k;return PREFIX+encodeURIComponent(active())+'::'+k;};

  function legacyPlayerPrefix(name){
    let h=2166136261;
    for(let i=0;i<name.length;i++){
      h^=name.charCodeAt(i);
      h=Math.imul(h,16777619);
    }
    return 'niu:p:'+('00000000'+(h>>>0).toString(16)).slice(-8)+':';
  }

  function migrateProfile(name){
    name=cleanName(name); if(!name)return false;
    const base=PREFIX+encodeURIComponent(name)+'::';
    const nested=base+base;
    const legacy=legacyPlayerPrefix(name);
    const keys=[];
    for(let i=0;i<nativeLength.call(window.localStorage);i++){
      const k=native.key.call(window.localStorage,i);
      if(k&&(k.startsWith(nested)||k.startsWith(legacy)||k.startsWith(base)))keys.push(k);
    }
    keys.forEach(k=>{
      if(k.startsWith(nested)){
        const target=base+k.slice(nested.length),value=native.getItem.call(window.localStorage,k);
        if(value!==null&&native.getItem.call(window.localStorage,target)===null)native.setItem.call(window.localStorage,target,value);
      }else if(k.startsWith(legacy)){
        const target=base+k.slice(legacy.length),value=native.getItem.call(window.localStorage,k);
        if(value!==null&&native.getItem.call(window.localStorage,target)===null)native.setItem.call(window.localStorage,target,value);
      }
    });

    ['niu_arg2_found','niu_arg2_stage1','niu_arg2_stage2','niu_arg2_stage3'].forEach(k=>{
      const legacyValue=native.getItem.call(window.localStorage,k),target=base+k;
      if(legacyValue!==null&&native.getItem.call(window.localStorage,target)===null)native.setItem.call(window.localStorage,target,legacyValue);
    });
    return true;
  }

  function activate(name){
    name=cleanName(name);if(!name)return false;
    const previous=active();
    migrateProfile(name);
    rawSet('niu_entrant_name',name);
    rawSet('niu_active_profile',name);
    rawSet('niu_profiles_version',VERSION);
    if(previous!==name)window.dispatchEvent(new CustomEvent('niu:profile-changed',{detail:{previous,current:name}}));
    return true;
  }

  if(cleanName(raw('niu_entrant_name')))rawSet('niu_active_profile',cleanName(raw('niu_entrant_name')));
  rawSet('niu_profiles_version',VERSION);
  migrateProfile(active());

  Storage.prototype.getItem=function(k){return native.getItem.call(this,scoped(k));};
  Storage.prototype.setItem=function(k,v){k=String(k);if(k==='niu_entrant_name')return activate(v);return native.setItem.call(this,scoped(k),String(v));};
  Storage.prototype.removeItem=function(k){return native.removeItem.call(this,scoped(k));};
  Storage.prototype.clear=function(){const a=active();if(!a)return;const p=PREFIX+encodeURIComponent(a)+'::',rm=[];for(let i=0;i<nativeLength.call(this);i++){const k=native.key.call(this,i);if(k&&k.startsWith(p))rm.push(k);}rm.forEach(k=>native.removeItem.call(this,k));};
  Storage.prototype.key=function(index){const a=active(),p=a?PREFIX+encodeURIComponent(a)+'::':'',list=[];for(let i=0;i<nativeLength.call(this);i++){const k=native.key.call(this,i);if(!k)continue;if(GLOBAL.has(k))list.push(k);else if(p&&k.startsWith(p))list.push(k.slice(p.length));}return list[index]??null;};
  Object.defineProperty(Storage.prototype,'length',{configurable:true,get:function(){const a=active(),p=a?PREFIX+encodeURIComponent(a)+'::':'',n=Array.from({length:nativeLength.call(this)},(_,i)=>native.key.call(this,i)).filter(k=>k&&(GLOBAL.has(k)||(p&&k.startsWith(p)))).length;return n;}});
  window.NIUProfiles={activate,current:active,cleanName};

  function syncEntranceControls(){
    const entrance=document.getElementById('entrance');
    if(!entrance)return;
    const locked=!entrance.classList.contains('hide');
    const selectors=['#arg2-trigger','a[href="shiryo-shitsu.html"]','a[href="archive16.html"]'];
    selectors.forEach(sel=>document.querySelectorAll(sel).forEach(el=>{
      if(locked){el.dataset.niuEntranceHidden='1';el.style.setProperty('display','none','important');el.style.setProperty('pointer-events','none','important');}
      else if(el.dataset.niuEntranceHidden==='1'){el.style.removeProperty('display');el.style.removeProperty('pointer-events');delete el.dataset.niuEntranceHidden;}
    }));
  }

  function installFixes(){
    if(!document.getElementById('niu-mobile-fix-v11')){
      const style=document.createElement('style');style.id='niu-mobile-fix-v11';style.textContent=`
        #entrance{z-index:100000!important}
        @media(max-width:760px){
          #arg2-trigger{left:10px!important;right:10px!important;bottom:240px!important;width:auto!important;min-height:44px!important;z-index:10003!important;pointer-events:auto!important;touch-action:manipulation!important}
          a[href="shiryo-shitsu.html"]{left:10px!important;right:10px!important;bottom:180px!important;min-height:44px!important;z-index:10002!important;pointer-events:auto!important;touch-action:manipulation!important}
          a[href="archive16.html"]{left:10px!important;right:10px!important;bottom:120px!important;min-height:44px!important;z-index:10001!important;pointer-events:auto!important;touch-action:manipulation!important}
        }
        @media(max-width:380px){#arg2-trigger{bottom:250px!important}a[href="shiryo-shitsu.html"]{bottom:188px!important}a[href="archive16.html"]{bottom:126px!important}}
      `;(document.head||document.documentElement).appendChild(style);
    }
    syncEntranceControls();
    const entrance=document.getElementById('entrance');
    if(entrance){new MutationObserver(syncEntranceControls).observe(entrance,{attributes:true,attributeFilter:['class']});}
    const enter=document.getElementById('enterButton');
    if(enter)enter.addEventListener('click',()=>setTimeout(syncEntranceControls,0),{capture:true});
    const input=document.getElementById('entrant-name');
    if(input){
      const saved=raw('niu_entrant_name');if(saved)input.value=saved;
      input.addEventListener('input',()=>{const n=cleanName(input.value);if(n)activate(n);});
      input.addEventListener('change',()=>{const n=cleanName(input.value);if(n)activate(n);});
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installFixes,{once:true});else installFixes();
})();
