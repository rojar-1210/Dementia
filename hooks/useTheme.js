import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DARK = {
  primary: '#4A90D9', secondary: '#F5A623', danger: '#E74C3C', success: '#27AE60',
  background: '#0f0f1a', card: '#1a1a2e', text: '#F0F4FF', subtext: '#9999bb', border: '#2a2a4a', white: '#FFFFFF',
};
const LIGHT = {
  primary: '#4A90D9', secondary: '#F5A623', danger: '#E74C3C', success: '#27AE60',
  background: '#F0F4FF', card: '#FFFFFF', text: '#1A1A2E', subtext: '#555577', border: '#D0D8F0', white: '#FFFFFF',
};
const FONT_SIZES = {
  Small:  { small: 13, medium: 16, large: 20, xlarge: 26, title: 32 },
  Large:  { small: 16, medium: 20, large: 26, xlarge: 32, title: 40 },
  XLarge: { small: 19, medium: 24, large: 30, xlarge: 38, title: 46 },
};

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState('Large');

  useEffect(() => {
    AsyncStorage.multiGet(['darkMode', 'fontSize']).then(pairs => {
      if (pairs[0][1] === 'true') setDarkMode(true);
      if (pairs[1][1]) setFontSize(pairs[1][1]);
    });
  }, []);

  const toggleDarkMode = async (val) => { setDarkMode(val); await AsyncStorage.setItem('darkMode', String(val)); };
  const changeFontSize = async (val) => { setFontSize(val); await AsyncStorage.setItem('fontSize', val); };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, fontSize, changeFontSize, colors: darkMode ? DARK : LIGHT, fonts: FONT_SIZES[fontSize], fontFamily: 'PlayfairDisplay', fontFamilyBold: 'PlayfairDisplay-Bold' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
