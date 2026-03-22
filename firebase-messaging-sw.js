// Firebase Cloud Messaging Service Worker
// Must be at root: firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAouNHeKQIC_zMCrW9eA6u7Jwq27ijgQAo",
  authDomain: "kliw-6657c.firebaseapp.com",
  databaseURL: "https://kliw-6657c-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "kliw-6657c",
  storageBucket: "kliw-6657c.firebasestorage.app",
  messagingSenderId: "434338152569",
  appId: "1:434338152569:web:3325e9f57311f60e1b14a8"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('[FCM SW] Background message:', payload);
  var data = payload.data || {};
  var notifTitle = data.title || payload.notification?.title || 'TACMAP';
  var notifBody  = data.body  || payload.notification?.body  || 'Nowe zdarzenie';
  var tag        = data.tag   || 'tacmap';
  var urgent     = data.urgent === 'true';
  var url        = data.url   || '/TacMap-1.0/';

  return self.registration.showNotification(notifTitle, {
    body: notifBody,
    icon: '/TacMap-1.0/icon-192.png',
    badge: '/TacMap-1.0/icon-192.png',
    tag: tag,
    renotify: true,
    requireInteraction: urgent,
    vibrate: urgent ? [500,200,500,200,500] : [200,100,200],
    data: { url: url }
  });
});

// Notification click handler
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || '/TacMap-1.0/';
  e.waitUntil(
    clients.matchAll({type:'window',includeUncontrolled:true}).then(function(list) {
      for(var i=0;i<list.length;i++){
        if(list[i].url.includes('TacMap')){ list[i].focus(); return; }
      }
      return clients.openWindow(url);
    })
  );
});
