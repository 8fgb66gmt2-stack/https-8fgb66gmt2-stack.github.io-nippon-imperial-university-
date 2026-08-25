/* N.I.U. / PLAYER PROFILE SLOTS — V7
   One browser may host many players. Game state is isolated by entrant name.
   Cache refresh marker: 2026-08-24
*/
(function(){
  'use strict';
  const GLOBAL = new Set(['niu_entrant_name','niu_active_profile','niu_profiles_version']);
  const VERSION = '7';
  const PREFIX = 'niu_profile_v7::';
  const native = {getItem:Storage.prototype.getItem,setItem:Storage.prototype.setItem,removeItem:Storage.prototype.removeItem,clear:Storage.prototype.clear,key:Storage.prototype.key};
  const nativeLength = Object.getOwnPropertyDescriptor(Storage.prototype,'length').get;
  function cleanName(v){return String(v||'').trim().replace(/[\\/:*?"<>|]/g,'').replace(/\s+/g,' ').slice(0,40)}
  function raw(k){return native.getItem.call(window.localStorage,k)}
  function rawSet(k,v){native.setItem.call(window.localStorage,k,String(v))}
  function active(){return cleanName(raw('niu_active_profile'))||cleanName(raw('niu_entrant_name'))||''}
  function scoped(k){k=String(k);if(GLOBAL.has(k)||!active())return k;return PREFIX+encodeURIComponent(active())+'::'+k}
  function activate(name){name=cleanName(name);if(!name)return false;const previous=active();rawSet('niu_entrant_name',name);rawSet('niu_active_profile',name);rawSet('niu_profiles_version',VERSION);if(previous!==name)window.dispatchEvent(new CustomEvent('niu:profile-changed',{detail:{previous,current:name}}));return true}
  if(cleanName(raw('niu_entrant_name')))rawSet('niu_active_profile',cleanName(raw('niu_entrant_name')));
  rawSet('niu_profiles_version',VERSION);
  Storage.prototype.getItem=function(k){return native.getItem.call(this,scoped(k))};
  Storage.prototype.setItem=function(k,v){k=String(k);if(k==='niu_entrant_name')return activate(v);return native.setItem.call(this,scoped(k),String(v))};
  Storage.prototype.removeItem=function(k){return native.removeItem.call(this,scoped(k))};
  Storage.prototype.clear=function(){const a=active();if(!a)return;const prefix=PREFIX+encodeURIComponent(a)+'::';const remove=[];for(let i=0;i<nativeLength.call(this);i++){const k=native.key.call(this,i);if(k&&k.startsWith(prefix))remove.push(k)}remove.forEach(k=>native.removeItem.call(this,k))};
  Storage.prototype.key=function(index){const a=active(),prefix=a?PREFIX+encodeURIComponent(a)+'::':'';const list=[];for(let i=0;i<nativeLength.call(this);i++){const k=native.key.call(this,i);if(!k)continue;if(GLOBAL.has(k))list.push(k);else if(prefix&&k.startsWith(prefix))list.push(k.slice(prefix.length))}return list[index]??null};
  Object.defineProperty(Storage.prototype,'length',{configurable:true,get:function(){const a=active(),prefix=a?PREFIX+encodeURIComponent(a)+'::':'';let n=0;for(let i=0;i<nativeLength.call(this);i++){const k=native.key.call(this,i);if(k&&(GLOBAL.has(k)||(prefix&&k.startsWith(prefix))))n++}return n}});
  window.NIUProfiles={activate,current:active,cleanName};
  document.addEventListener('DOMContentLoaded',function(){const input=document.getElementById('entrant-name');if(input){const saved=raw('niu_entrant_name');if(saved)input.value=saved;input.addEventListener('change',function(){const value=cleanName(this.value);if(value)activate(value)})}});

  /* Mobile layout fix V2: the three bottom archive controls receive
     separate vertical slots so their hit areas can never overlap. */
  (function installMobileArchiveLayout(){
    if(document.getElementById('niu-mobile-archive-layout-fix-v2')) return;
    const style=document.createElement('style');
    style.id='niu-mobile-archive-layout-fix-v2';
    style.textContent=`
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
        }
      }
      @media (max-width:380px){
        #arg2-trigger{bottom:250px !important;}
        a[href="shiryo-shitsu.html"]{bottom:188px !important;}
        a[href="archive16.html"]{bottom:126px !important;}
      }
      @media (max-width:760px){
        body{padding-bottom:300px !important;}
      }
    `;
    (document.head||document.documentElement).appendChild(style);
  })();
})();