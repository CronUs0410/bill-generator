import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDeabS0oZ7wFhYMuXjHpTi2-N0fp4I8HGM",
  authDomain: "bill-generator-91246.firebaseapp.com",
  projectId: "bill-generator-91246",
  storageBucket: "bill-generator-91246.firebasestorage.app",
  messagingSenderId: "250028528069",
  appId: "1:250028528069:web:7f9570d0398b40494a3bac"
};

// Initialize Firebase only once
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
