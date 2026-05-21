import {
  collection, addDoc, getDocs, updateDoc,
  deleteDoc, doc, query, where, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ── Reminders ──────────────────────────────────────────────
export const addReminder = (uid, data) =>
  addDoc(collection(db, 'reminders'), { uid, ...data, createdAt: serverTimestamp() });

export const getReminders = async (uid) => {
  const q = query(collection(db, 'reminders'), where('uid', '==', uid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
};

export const deleteReminder = (id) => deleteDoc(doc(db, 'reminders', id));

// ── Appointments ───────────────────────────────────────────
export const addAppointment = (uid, data) =>
  addDoc(collection(db, 'appointments'), { uid, ...data, createdAt: serverTimestamp() });

export const getAppointments = async (uid) => {
  const q = query(collection(db, 'appointments'), where('uid', '==', uid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
};

export const deleteAppointment = (id) => deleteDoc(doc(db, 'appointments', id));

// ── Activity Logs ──────────────────────────────────────────
export const logActivity = (uid, activity) =>
  addDoc(collection(db, 'activityLogs'), { uid, activity, timestamp: serverTimestamp() });

export const getActivityLogs = async (uid) => {
  const q = query(collection(db, 'activityLogs'), where('uid', '==', uid));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
};

// ── Location ───────────────────────────────────────────────
export const updateLocation = (uid, coords) =>
  updateDoc(doc(db, 'users', uid), {
    location: { lat: coords.latitude, lng: coords.longitude, updatedAt: new Date().toISOString() },
  });

// ── Caregiver: all patients ────────────────────────────────
export const getAllPatients = async () => {
  const q = query(collection(db, 'users'), where('role', '==', 'patient'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ── Caregiver: patient reminders ──────────────────────────
export const getPatientReminders = async (uid) => {
  const q = query(collection(db, 'reminders'), where('uid', '==', uid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
};

export const addPatientReminder = (uid, data, caregiverUid) =>
  addDoc(collection(db, 'reminders'), { uid, ...data, addedBy: caregiverUid, createdAt: serverTimestamp() });

export const deletePatientReminder = (id) => deleteDoc(doc(db, 'reminders', id));

// ── Caregiver: patient appointments ───────────────────────
export const getPatientAppointments = async (uid) => {
  const q = query(collection(db, 'appointments'), where('uid', '==', uid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
};

export const addPatientAppointment = (uid, data, caregiverUid) =>
  addDoc(collection(db, 'appointments'), { uid, ...data, addedBy: caregiverUid, createdAt: serverTimestamp() });

export const deletePatientAppointment = (id) => deleteDoc(doc(db, 'appointments', id));
