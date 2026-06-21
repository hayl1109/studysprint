import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
 apiKey: "AIzaSyAqa4bw9z4lIr7dlr3CWVmKCNWl4by3Mac",
  authDomain: "studysprint-41d8e.firebaseapp.com",
  projectId: "studysprint-41d8e",
  storageBucket: "studysprint-41d8e.firebasestorage.app",
  messagingSenderId: "952033687173",
  appId: "1:952033687173:web:e1a91cc99e1dc56f80dbec",
  measurementId: "G-2KPZY8GNNG",
 apiCallbackUrl: import.meta.env.VITE_API_CALLBACK_URL || 'https://studysprint-orpin/api/callback'
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app); 
