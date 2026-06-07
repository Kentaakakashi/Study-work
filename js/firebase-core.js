// firebase-core.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAgZTTRP2hbvaE2yU-qMcdyAcNihBKS0Vo",
  authDomain: "stufy-zen.firebaseapp.com",
  projectId: "stufy-zen",
  storageBucket: "stufy-zen.firebasestorage.app",
  messagingSenderId: "154370292148",
  appId: "1:154370292148:web:704d2bee95dd935f805ae1",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
