/* Service worker — Tu dois le savoir !?
   Met l'app en cache pour un lancement rapide et un fonctionnement hors ligne.
   Les appels Firebase/gstatic (autres domaines) ne sont jamais interceptés. */
const CACHE='tdls-v2';
const ASSETS=['./','./index.html','./manifest.webmanifest',
  './icons/icon-192.png','./icons/icon-512.png','./icons/maskable-512.png','./icons/apple-touch-icon.png','./icons/favicon-64.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{}).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  let url;try{url=new URL(req.url)}catch(_){return}
  if(url.origin!==location.origin)return; // Firebase, Google Fonts, etc. : réseau direct
  const isDoc=req.mode==='navigate'||url.pathname.endsWith('/')||url.pathname.endsWith('index.html');
  if(isDoc){
    // réseau d'abord (pour recevoir les mises à jour), cache si hors ligne
    e.respondWith(fetch(req).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put('./index.html',cp));return r})
      .catch(()=>caches.match(req).then(r=>r||caches.match('./index.html'))));
  }else{
    // cache d'abord pour les icônes/ressources
    e.respondWith(caches.match(req).then(r=>r||fetch(req).then(r2=>{const cp=r2.clone();caches.open(CACHE).then(c=>c.put(req,cp));return r2})));
  }
});
