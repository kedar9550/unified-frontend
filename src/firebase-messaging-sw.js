importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

if (workbox) {
    workbox.setConfig({ debug: false });
    workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);
}

importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyCEjaKCgxHfE78zFG8dryDurGdJNiksuio",
    authDomain: "aus-digital-services.firebaseapp.com",
    projectId: "aus-digital-services",
    storageBucket: "aus-digital-services.firebasestorage.app",
    messagingSenderId: "559716876595",
    appId: "1:559716876595:web:975f0ceec56ec29816fe46"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Note: Since the backend sends a "notification" payload, Firebase SDK 
    // will automatically display the notification. 
    // We do not need to call self.registration.showNotification() here, 
    // otherwise it may cause duplicate notifications or errors.
});

self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification click received.');
    event.notification.close();

    // Open the app when the notification is clicked
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Check if there is already a window/tab open with the target URL
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === self.registration.scope && 'focus' in client) {
                    return client.focus();
                }
            }
            // If no window is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow(self.registration.scope);
            }
        })
    );
});

// Listen for the SKIP_WAITING message to allow the UI to trigger an update
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
