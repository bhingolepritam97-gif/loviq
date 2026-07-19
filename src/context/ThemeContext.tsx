import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LightColors, DarkColors } from '../theme';
import i18n from '../i18n';

const ThemeContext = createContext<any>({
  themeMode: 'system',
  isDark: false,
  colors: LightColors,
  language: 'en',
  setThemeMode: async () => {},
  setLanguage: async () => {},
});

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = Appearance.getColorScheme();
  const [themeMode, setThemeModeState] = useState('system'); // 'light', 'dark', 'system'
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');
  const [language, setLanguageState] = useState(i18n.locale);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('themeMode');
        if (savedTheme) {
          setThemeModeState(savedTheme);
          if (savedTheme === 'system') {
            setIsDark(systemColorScheme === 'dark');
          } else {
            setIsDark(savedTheme === 'dark');
          }
        }
        
        const savedLanguage = await AsyncStorage.getItem('language');
        if (savedLanguage) {
          setLanguageState(savedLanguage);
          i18n.locale = savedLanguage;
        }
      } catch (e) {
        console.warn('Failed to load theme:', e);
      }
    };
    loadTheme();
  }, []);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (themeMode === 'system') {
        setIsDark(colorScheme === 'dark');
      }
    });
    return () => subscription.remove();
  }, [themeMode]);

  const setThemeMode = async (mode) => {
    setThemeModeState(mode);
    if (mode === 'system') {
      setIsDark(Appearance.getColorScheme() === 'dark');
    } else {
      setIsDark(mode === 'dark');
    }
    try {
      await AsyncStorage.setItem('themeMode', mode);
    } catch (e) {
      console.warn('Failed to save theme:', e);
    }
  };

  const setLanguage = async (lang) => {
    setLanguageState(lang);
    i18n.locale = lang;
    try {
      await AsyncStorage.setItem('language', lang);
    } catch (e) {
      console.warn('Failed to save language:', e);
    }
  };

  const colors = isDark ? DarkColors : LightColors;

  return (
    <ThemeContext.Provider value={{ themeMode, isDark, colors, setThemeMode, language, setLanguage }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
