// firebase.js (for backend)

const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');

// Your web app's Firebase configuration (use the same one as in your frontend)
const firebaseConfig = {
  apiKey: "AIzaSyDThRx2T3ohGVg1iSrWfEFHiSgJ8-GOQPI",
  authDomain: "miniapp-gambler.firebaseapp.com",
  projectId: "miniapp-gambler",
  storageBucket: "miniapp-gambler.appspot.com",
  messagingSenderId: "83197368154",
  appId: "1:83197368154:web:04690268c5a817765a8563"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

module.exports = { db };
