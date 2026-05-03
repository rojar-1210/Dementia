import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ── Reminders ──────────────────────────────────────────────
export const addReminder = (uid, data) =>
  addDoc(collection(db, 'reminders'), { uid, ...data, createdAt: serverTimestamp() });

export const getReminders = async (uid) => {
  const q = query(collection(db, 'reminders'), where('uid', '==', uid), orderBy('time'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const deleteReminder = (id) => deleteDoc(doc(db, 'reminders', id));

// ── Appointments ───────────────────────────────────────────
export const addAppointment = (uid, data) =>
  addDoc(collection(db, 'appointments'), { uid, ...data, createdAt: serverTimestamp() });

export const getAppointments = async (uid) => {
  const q = query(collection(db, 'appointments'), where('uid', '==', uid), orderBy('date'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const deleteAppointment = (id) => deleteDoc(doc(db, 'appointments', id));

// ── Activity Logs ──────────────────────────────────────────
export const logActivity = (uid, activity) =>
  addDoc(collection(db, 'activityLogs'), { uid, activity, timestamp: serverTimestamp() });

export const getActivityLogs = async (uid) => {
  const q = query(collection(db, 'activityLogs'), where('uid', '==', uid), orderBy('timestamp', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// ── Location ───────────────────────────────────────────────
export const updateLocation = (uid, coords) =>
  updateDoc(doc(db, 'users', uid), {
    location: { lat: coords.latitude, lng: coords.longitude, updatedAt: new Date().toISOString() },
  });
