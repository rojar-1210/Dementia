import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

export { auth };
export const db = getFirestore(app);
