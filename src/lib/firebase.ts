import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Firebase config copied from the working Study Zone project (CDN version),
 * so all existing Firestore collections keep working.
 */
const firebaseConfig = {
  apiKey: "AIzaSyAgZTTRP2hbvaE2yU-qMcdyAcNihBKS0Vo",
  authDomain: "stufy-zen.firebaseapp.com",
  projectId: "stufy-zen",
  storageBucket: "stufy-zen.firebasestorage.app",
  messagingSenderId: "154370292148",
  appId: "1:154370292148:web:704d2bee95dd935f805ae1",
};

export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
