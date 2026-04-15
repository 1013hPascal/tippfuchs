// Service Worker für Firebase Cloud Messaging (Hintergrund-Push-Benachrichtigungen)
importScripts('https://www.gstatic.com/firebasejs/12.11.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.11.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAhUP8OhoypgMmYlGozFZAAy2BcmtYdym4",
  authDomain: "wortjaeger-blindmove.firebaseapp.com",
  databaseURL: "https://wortjaeger-blindmove-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "wortjaeger-blindmove",
  storageBucket: "wortjaeger-blindmove.firebasestorage.app",
  messagingSenderId: "450913417770",
  appId: "1:450913417770:web:1d8b5947837b62e9186153"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Tippfuchs';
  const body = payload.notification?.body || 'Du hast heute noch nicht gespielt!';
  self.registration.showNotification(title, {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    lang: 'de',
    requireInteraction: false
  });
});
