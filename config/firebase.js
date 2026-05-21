import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCod6G5jKHMkNV3XyEPKvaEUcYpb227-zg",
  authDomain: "dementia-a06cd.firebaseapp.com",
  projectId: "dementia-a06cd",
  storageBucket: "dementia-a06cd.firebasestorage.app",
  messagingSenderId: "85788968871",
  appId: "1:85788968871:web:694070eb4ede4fe5435882",
  measurementId: "G-JEZ8L03Y0J",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
