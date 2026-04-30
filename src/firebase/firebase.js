// /src/firebase/firebase.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDApQg2-SmVZMH_QSRnV-cxkebJM9pNe6s",
  authDomain: "medium-3254d.firebaseapp.com",
  projectId: "medium-3254d",
  storageBucket: "medium-3254d.firebasestorage.app",
  messagingSenderId: "738498502815",
  appId: "1:738498502815:web:8de585a10c52d33336c2aa",
  measurementId: "G-YL1SHX0HB2",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const analyticsPromise = isSupported()
  .then((supported) => {
    if (!supported) return null;
    return getAnalytics(app);
  })
  .catch(() => null);