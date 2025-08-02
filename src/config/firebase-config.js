// Configuration Firebase pour SAV Audio
const firebaseConfig = {
  apiKey: "AIzaSyBTHGWZt-Eg2gG8nLNs8aWgEw6evBIOeZ4",
  authDomain: "orixis-pwa.firebaseapp.com",
  projectId: "orixis-pwa",
  storageBucket: "orixis-pwa.firebasestorage.app",
  messagingSenderId: "410837125332",
  appId: "1:410837125332:web:b2eeebb976fb10eeb59341",
  measurementId: "G-PJ8K3Q4W4E"
};

// Variables pour les services Firebase
let app;
let db;
let auth;
let storage;

// Export pour utilisation dans d'autres fichiers
export { firebaseConfig, app, db, auth, storage };
