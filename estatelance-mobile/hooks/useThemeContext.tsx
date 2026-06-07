import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEMES, ThemeKey, ThemeDef, DEFAULT_THEME } from '../constants/themes';
import * as ColorsModule from '../constants/colors';

const STORAGE_KEY = 'app_theme';

interface ThemeCtx {
  theme:      ThemeDef;
  themeKey:   ThemeKey;
  setTheme:   (key: ThemeKey) => void;
  renderKey:  number;
}

const ThemeContext = createContext<ThemeCtx>({
  theme:     THEMES[0],
  themeKey:  DEFAULT_THEME,
  setTheme:  () => {},
  renderKey: 0,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeKey,  setThemeKey]  = useState<ThemeKey>(DEFAULT_THEME);
  const [renderKey, setRenderKey] = useState(0);

  const applyColors = (key: ThemeKey) => {
    const t = THEMES.find(th => th.key === key)!;
    Object.assign(ColorsModule.Colors, t.colors);
  };

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(v => {
      if (v && THEMES.find(t => t.key === v)) {
        applyColors(v as ThemeKey);
        setThemeKey(v as ThemeKey);
        setRenderKey(k => k + 1); // Stillarni qayta hisoblash uchun
      } else {
        applyColors(DEFAULT_THEME);
      }
    });
  }, []);

  const setTheme = useCallback((key: ThemeKey) => {
    applyColors(key);
    setThemeKey(key);
    setRenderKey(k => k + 1); // Butun app qayta render — StyleSheet'lar yangilanadi
    AsyncStorage.setItem(STORAGE_KEY, key);
  }, []);

  const theme = THEMES.find(t => t.key === themeKey) ?? THEMES[0];

  return (
    <ThemeContext.Provider value={{ theme, themeKey, setTheme, renderKey }}>
      {/* key o'zgarganda barcha farzand komponentlar qayta mount bo'ladi */}
      <React.Fragment key={renderKey}>
        {children}
      </React.Fragment>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
