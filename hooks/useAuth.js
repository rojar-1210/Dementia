import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { getUserProfile, handleGoogleRedirectResult } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle Google redirect result first before setting up auth listener
    const savedRole = typeof localStorage !== 'undefined' ? localStorage.getItem('googleRole') || 'patient' : 'patient';
    handleGoogleRedirectResult(savedRole).finally(() => {
      if (typeof localStorage !== 'undefined') localStorage.removeItem('googleRole');
    });

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
