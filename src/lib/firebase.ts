import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Firebase config copied from the working Study Zone project (CDN version),
 * so all existing Firestore collections keep working.
 */
const firebaseConfig = {
  apiKey: "AIzaSyCQZ36IQVFEm-rqyD0WlPO23Sf8Lih5Fo8",
  authDomain: "study-zone-438c4.firebaseapp.com",
  projectId: "study-zone-438c4",
  storageBucket: "study-zone-438c4.firebasestorage.app",
  messagingSenderId: "320895535749",
  appId: "1:320895535749:web:cab35a214ef7c22ae2f7ec",
};

export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
