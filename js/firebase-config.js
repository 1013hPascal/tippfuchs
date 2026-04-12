// FIREBASE-IMPORTS ANFANG
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getDatabase, ref, set, get, child, remove } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut, deleteUser } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
// FIREBASE-IMPORTS ENDE

// FIREBASE-CONFIG ANFANG
const firebaseConfig = {
  apiKey: "AIzaSyAhUP8OhoypgMmYlGozFZAAy2BcmtYdym4",
  authDomain: "wortjaeger-blindmove.firebaseapp.com",
  databaseURL: "https://wortjaeger-blindmove-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "wortjaeger-blindmove",
  storageBucket: "wortjaeger-blindmove.firebasestorage.app",
  messagingSenderId: "450913417770",
  appId: "1:450913417770:web:1d8b5947837b62e9186153"
};
const firebaseApp = initializeApp(firebaseConfig);
export const db = getDatabase(firebaseApp);
export const auth = getAuth(firebaseApp);
export const provider = new GoogleAuthProvider();
// FIREBASE-CONFIG ENDE

// Re-Exports der Firebase-Hilfsfunktionen für andere Module
export { ref, set, get, child, remove };
export { signInWithPopup, onAuthStateChanged, createUserWithEmailAndPassword,
         signInWithEmailAndPassword, sendPasswordResetEmail, signOut, deleteUser };
