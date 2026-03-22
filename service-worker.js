const CACHE = 'tacmap-v3';
const ASSETS = [
  './index.html',
  './manifest.json',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js',
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(cache){
      return cache.addAll(ASSETS.map(function(url){
        return new Request(url, {mode:'no-cors'});
      }));
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){return k!==CACHE}).map(function(k){return caches.delete(k)}));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  if(e.request.url.includes('firebase') || e.request.url.includes('googleapis')){
    e.respondWith(fetch(e.request).catch(function(){ return caches.match(e.request); }));
    return;
  }
  if(e.request.url.includes('carto') || e.request.url.includes('openstreetmap') || e.request.url.includes('osrm') || e.request.url.includes('nominatim') || e.request.url.includes('open-meteo')){
    e.respondWith(
      fetch(e.request).then(function(resp){
        var clone = resp.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, clone); });
        return resp;
      }).catch(function(){ return caches.match(e.request); })
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached) return cached;
      return fetch(e.request).then(function(resp){
        if(resp && resp.status===200 && e.request.method==='GET'){
          var clone=resp.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, clone); });
        }
        return resp;
      });
    })
  );
});

/* ── PUSH NOTIFICATIONS ── */
self.addEventListener('push', function(e){
  var data = {};
  try{ data = e.data ? e.data.json() : {}; }catch(ex){ data={title:'TACMAP',body:e.data?e.data.text():'Nowe powiadomienie'}; }
  var opts = {
    body: data.body || 'Nowe zdarzenie taktyczne',
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: data.tag || 'tacmap-notif',
    renotify: true,
    requireInteraction: data.urgent || false,
    vibrate: data.urgent ? [500,200,500,200,500] : [200,100,200],
    data: { url: data.url || './', ts: Date.now() },
    actions: data.actions || []
  };
  e.waitUntil(self.registration.showNotification(data.title || 'TACMAP', opts));
});

self.addEventListener('notificationclick', function(e){
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(
    clients.matchAll({type:'window',includeUncontrolled:true}).then(function(clientList){
      for(var i=0;i<clientList.length;i++){
        if(clientList[i].url.includes('TacMap') || clientList[i].url.includes('tacmap')){
          clientList[i].focus();
          clientList[i].postMessage({type:'notification-click', url:url});
          return;
        }
      }
      return clients.openWindow(url);
    })
  );
});

/* ── BACKGROUND SYNC ── */
self.addEventListener('message', function(e){
  if(e.data && e.data.type==='PUSH_NOTIFY'){
    var d = e.data;
    self.registration.showNotification(d.title||'TACMAP', {
      body: d.body||'',
      icon: './icon-192.png',
      badge: './icon-192.png',
      tag: d.tag||'tacmap',
      renotify: true,
      requireInteraction: d.urgent||false,
      vibrate: d.urgent ? [500,200,500,200,500] : [200,100,200],
      data: {url: d.url||'./'}
    });
  }
});
