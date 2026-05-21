import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Platform } from 'react-native';
import { auth, db } from '../config/firebase';

export const signUp = async (email, password, name, role) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, 'users', userCredential.user.uid), {
    uid: userCredential.user.uid,
    email,
    name,
    role,
    createdAt: new Date().toISOString(),
  });
  return userCredential.user;
};

export const signIn = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const logOut = async () => {
  await signOut(auth);
};

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
};

export const signInWithGoogle = async (role = 'patient') => {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  provider.setCustomParameters({ prompt: 'select_account' });

  // Try popup first, fall back to redirect
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (!snap.exists()) {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        name: user.displayName || 'User',
        role,
        createdAt: new Date().toISOString(),
      });
    }
    const profile = await getDoc(doc(db, 'users', user.uid));
    return { user, profile: profile.data() };
  } catch (err) {
    if (err.code === 'auth/unauthorized-domain' || err.code === 'auth/popup-blocked') {
      // Use redirect as fallback
      if (typeof localStorage !== 'undefined') localStorage.setItem('googleRole', role);
      await signInWithRedirect(auth, provider);
      return null;
    }
    // Show friendly error for other cases
    if (err.code === 'auth/popup-closed-by-user') return null;
    throw err;
  }
};

export const handleGoogleRedirectResult = async (role = 'patient') => {
  try {
    const result = await getRedirectResult(auth);
    if (!result) return null;
    const user = result.user;
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (!snap.exists()) {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        name: user.displayName || 'User',
        role,
        createdAt: new Date().toISOString(),
      });
    }
    const profile = await getDoc(doc(db, 'users', user.uid));
    return { user, profile: profile.data() };
  } catch (e) {
    return null;
  }
};
