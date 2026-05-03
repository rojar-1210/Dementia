import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export const signUp = async (email, password, name, role) => {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email,
    name,
    role, // 'patient' | 'caregiver'
    createdAt: new Date().toISOString(),
  });
  return user;
};

export const signIn = async (email, password) => {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  const snap = await getDoc(doc(db, 'users', user.uid));
  return { user, profile: snap.data() };
};

export const logOut = () => signOut(auth);

export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);

export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
};
