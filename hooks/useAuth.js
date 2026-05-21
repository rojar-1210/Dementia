import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { getUserProfile } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Always sign out on fresh load in dev/web
    if (typeof window !== 'undefined') {
      signOut(auth).catch(() => {});
    }

    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setLoading(false);
        getUserProfile(firebaseUser.uid).then(setProfile);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  const refreshProfile = async () => {
    if (user) getUserProfile(user.uid).then(setProfile);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
