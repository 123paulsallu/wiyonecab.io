import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeContextType {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  colors: {
    background: string;
    card: string;
    text: string;
    subtext: string;
    border: string;
    headerBg: string;
    primary: string;
    secondary: string;
    success: string;
    error: string;
  };
}

const lightColors = {
  background: '#f9f9f9',
  card: '#fff',
  text: '#000',
  subtext: '#999',
  border: '#e0e0e0',
  headerBg: '#000',
  primary: '#FFB81C',
  secondary: '#f0f0f0',
  success: '#4CAF50',
  error: '#E53935',
};

const darkColors = {
  background: '#1a1a1a',
  card: '#262626',
  text: '#fff',
  subtext: '#aaa',
  border: '#333',
  headerBg: '#0a0a0a',
  primary: '#FFB81C',
  secondary: '#333',
  success: '#4CAF50',
  error: '#E53935',
};

export const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  setIsDarkMode: () => {},
  colors: lightColors,
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDarkMode, setIsDarkModeState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('darkModeEnabled');
        if (savedTheme !== null) {
          setIsDarkModeState(JSON.parse(savedTheme));
        }
      } catch (err) {
        console.warn('Error loading theme:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  const setIsDarkMode = async (value: boolean) => {
    try {
      setIsDarkModeState(value);
      await AsyncStorage.setItem('darkModeEnabled', JSON.stringify(value));
    } catch (err) {
      console.warn('Error saving theme:', err);
    }
  };

  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
