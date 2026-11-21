import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import { storage } from '../services/storage';
import { colors } from '../theme/colors';

type ThemeMode = 'light' | 'dark';
type ThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  palette: typeof colors.light;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>(Appearance.getColorScheme() === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    let active = true;
    storage.getItem('theme_mode').then((savedMode) => {
      if (active && (savedMode === 'light' || savedMode === 'dark')) setMode(savedMode);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  const setTheme = useCallback((nextMode: ThemeMode) => {
    setMode(nextMode);
    storage.setItem('theme_mode', nextMode).catch(() => {});
  }, []);
  const toggleTheme = useCallback(() => setTheme(mode === 'dark' ? 'light' : 'dark'), [mode, setTheme]);
  const value = useMemo(() => ({ mode, isDark: mode === 'dark', palette: mode === 'dark' ? colors.dark : colors.light, toggleTheme, setTheme }), [mode, toggleTheme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useAppTheme must be used inside ThemeProvider');
  return context;
};
