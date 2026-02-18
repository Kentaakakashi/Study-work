// firebase-core.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCQZ36IQVFEm-rqyD0WlPO23Sf8Lih5Fo8",
  authDomain: "study-zone-438c4.firebaseapp.com",
  projectId: "study-zone-438c4",
  storageBucket: "study-zone-438c4.firebasestorage.app",
  messagingSenderId: "320895535749",
  appId: "1:320895535749:web:cab35a214ef7c22ae2f7ec"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
