import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBnZjs508TSjtYsniHDKanb2Ud9_8HnXFY",
  authDomain: "twistora-53603.firebaseapp.com",
  projectId: "twistora-53603",
  storageBucket: "twistora-53603.firebasestorage.app",
  messagingSenderId: "924852123135",
  appId: "1:924852123135:web:48deb33dbec0517b4623ca",
  measurementId: "G-VTGT8CEWG5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);