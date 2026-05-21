import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DARK = {
  primary: '#4A90D9',
  secondary: '#F5A623',
  danger: '#E74C3C',
  success: '#27AE60',
  background: '#0f0f1a',
  card: '#1a1a2e',
  text: '#F0F4FF',
  subtext: '#9999bb',
  border: '#2a2a4a',
  white: '#FFFFFF',
};

const LIGHT = {
  primary: '#4A90D9',
  secondary: '#F5A623',
  danger: '#E74C3C',
  success: '#27AE60',
  background: '#F0F4FF',
  card: '#FFFFFF',
  text: '#1A1A2E',
  subtext: '#555577',
  border: '#D0D8F0',
  white: '#FFFFFF',
};

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('darkMode').then(v => { if (v === 'true') setDarkMode(true); });
  }, []);

  const toggleDarkMode = async (val) => {
    setDarkMode(val);
    await AsyncStorage.setItem('darkMode', String(val));
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, colors: darkMode ? DARK : LIGHT }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
