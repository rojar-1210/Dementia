import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle Google redirect result on page load
    const savedRole = typeof localStorage !== 'undefined'
      ? localStorage.getItem('googleRole') || 'patient'
      : 'patient';

    getRedirectResult(auth).then(async (result) => {
      if (result?.user) {
        const snap = await getDoc(doc(db, 'users', result.user.uid));
        if (!snap.exists()) {
          await setDoc(doc(db, 'users', result.user.uid), {
            uid: result.user.uid,
            email: result.user.email,
            name: result.user.displayName || 'User',
            role: savedRole,
            createdAt: new Date().toISOString(),
          });
        }
        if (typeof localStorage !== 'undefined') localStorage.removeItem('googleRole');
      }
    }).catch(() => {});

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Always fetch fresh profile from Firestore
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (snap.exists()) {
            const profileData = snap.data();
            console.log('Profile loaded:', profileData.role); // debug
            setProfile(profileData);
          } else {
            setProfile(null);
          }
        } catch (e) {
          console.error('Profile fetch error:', e);
          setProfile(null);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return unsub;
  }, []);

  const refreshProfile = async () => {
    if (user) {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) setProfile(snap.data());
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
