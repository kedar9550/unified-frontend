import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyCEjaKCgxHfE78zFG8dryDurGdJNiksuio",
    authDomain: "aus-digital-services.firebaseapp.com",
    projectId: "aus-digital-services",
    storageBucket: "aus-digital-services.firebasestorage.app",
    messagingSenderId: "559716876595",
    appId: "1:559716876595:web:975f0ceec56ec29816fe46"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestForToken = async () => {
    try {
        let registration = null;
        if ('serviceWorker' in navigator) {
            registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        }

        const currentToken = await getToken(messaging, {
            vapidKey: 'BJw8wpJBtSZfwOfKWl3x313etpLEa7aG6X3pqoF2zUH7hoE5H5FkmthGaFSh0l_qYzQcba3yI3yLnR8CVxgw6sk',
            serviceWorkerRegistration: registration
        });
        if (currentToken) {
            console.log('current token for client: ', currentToken);
            return currentToken;
        } else {
            console.log('No registration token available. Request permission to generate one.');
            return null;
        }
    } catch (err) {
        console.error('An error occurred while retrieving token. ', err);
        throw err;
    }
};

export const onMessageListener = (callback) => {
    return onMessage(messaging, (payload) => {
        callback(payload);
    });
};
