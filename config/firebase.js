import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBUJvpnViwEEWS_UXWMYDAHHmZMEOxLggc",
  authDomain: "dementia-care-56569.firebaseapp.com",
  projectId: "dementia-care-56569",
  storageBucket: "dementia-care-56569.firebasestorage.app",
  messagingSenderId: "1003875842780",
  appId: "1:1003875842780:web:84965392036b92e6ff9219",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
