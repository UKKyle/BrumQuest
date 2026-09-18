const C='brumquest-pages-v3';
const SHELL=['./','./index.html','./styles.css','./app.js','./core.js','./manifest.webmanifest','./icon.svg','./apple-touch-icon.png','./icon-192.png','./icon-512.png'];
const STATIC_HOSTS=new Set(['unpkg.com','esm.sh']);

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(C).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==C).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  const sameOrigin=url.origin===self.location.origin;

  if(sameOrigin&&event.request.mode==='navigate'){
    event.respondWith(
      fetch(event.request).then(response=>{
        if(response.ok){const copy=response.clone();caches.open(C).then(cache=>cache.put('./',copy))}
        return response;
      }).catch(()=>caches.match('./'))
    );
    return;
  }

  const cacheableExternal=STATIC_HOSTS.has(url.hostname)||url.hostname.endsWith('.tile.openstreetmap.org');
  if(!sameOrigin&&!cacheableExternal)return;

  event.respondWith(
    caches.match(event.request).then(cached=>{
      if(cached)return cached;
      return fetch(event.request).then(response=>{
        if(response.ok||response.type==='opaque'){
          const copy=response.clone();
          caches.open(C).then(cache=>cache.put(event.request,copy));
        }
        return response;
      });
    })
  );
});