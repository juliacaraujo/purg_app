import React, { createContext, useContext, useState } from "react";
import { Platform } from "react-native";

export interface ThemeColors {
  background: string;
  backgroundSecondary: string;
  card: string;
  border: string;
  borderLight: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  primary: string;
  tabBar: string;
  header: string;
  inputBorder: string;
  heroCard: string;
  eyeBtn: string;
}

const light: ThemeColors = {
  background: "#ffffff",
  backgroundSecondary: "#f5f5f5",
  card: "#ffffff",
  border: "#dddddd",
  borderLight: "#f0f0f0",
  textPrimary: "#000000",
  textSecondary: "#555555",
  textTertiary: "#888888",
  primary: "#34C759",
  tabBar: "#ffffff",
  header: "#ffffff",
  inputBorder: "#dddddd",
  heroCard: "#111111",
  eyeBtn: "#e4e4e4",
};

const dark: ThemeColors = {
  background: "#111111",
  backgroundSecondary: "#1c1c1e",
  card: "#2c2c2e",
  border: "#3a3a3c",
  borderLight: "#3a3a3c",
  textPrimary: "#f2f2f7",
  textSecondary: "#aeaeb2",
  textTertiary: "#8e8e93",
  primary: "#30d158",
  tabBar: "#1c1c1e",
  header: "#1c1c1e",
  inputBorder: "#3a3a3c",
  heroCard: "#000000",
  eyeBtn: "#3a3a3c",
};

export const lightColors: ThemeColors = light;

const STORAGE_KEY = "purg_dark_mode";

function savePref(isDark: boolean) {
  if (Platform.OS === "web") {
    try { localStorage.setItem(STORAGE_KEY, isDark ? "1" : "0"); } catch {}
  }
}

function loadPref(): boolean {
  if (Platform.OS === "web") {
    try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch {}
  }
  return false;
}

interface Ctx {
  isDark: boolean;
  colors: ThemeColors;
  setDark: (v: boolean) => void;
}

const ThemeContext = createContext<Ctx>({ isDark: false, colors: light, setDark: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState<boolean>(() => loadPref());

  const setDark = (v: boolean) => {
    setIsDark(v);
    savePref(v);
  };

  return (
    <ThemeContext.Provider value={{ isDark, colors: isDark ? dark : light, setDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
