
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDThRx2T3ohGVg1iSrWfEFHiSgJ8-GOQPI",
  authDomain: "miniapp-gambler.firebaseapp.com",
  projectId: "miniapp-gambler",
  storageBucket: "miniapp-gambler.appspot.com",
  messagingSenderId: "83197368154",
  appId: "1:83197368154:web:04690268c5a817765a8563"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);

export { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, doc, getDoc, setDoc };

export default app;
