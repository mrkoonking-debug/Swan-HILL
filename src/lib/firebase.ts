import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "swan-hill-0474",
  appId: "1:957462872673:web:485245c444d697c460e020",
  storageBucket: "swan-hill-0474.firebasestorage.app",
  apiKey: "AIzaSyBoEmO55NGaqg6GSI_Nr2E3JB2_lUnYZU0",
  authDomain: "swan-hill-0474.firebaseapp.com",
  messagingSenderId: "957462872673",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Auth providers
export const googleProvider = new GoogleAuthProvider();
