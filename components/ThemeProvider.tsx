"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ACCENT_PRESETS, DEFAULT_THEME, THEME_STORAGE_KEY, deriveTheme, type AccentTheme } from "../lib/theme";

function applyTheme(theme: AccentTheme) {
  const root = document.documentElement;
  root.style.setProperty("--cx-accent", theme.accent);
  root.style.setProperty("--cx-accent-light", theme.light);
  root.style.setProperty("--cx-accent-dark", theme.dark);
}

type ThemeContextValue = {
  theme: AccentTheme;
  setPreset: (theme: AccentTheme) => void;
  setCustomAccent: (hex: string) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<AccentTheme>(DEFAULT_THEME);

  useEffect(() => {
    // Deferred to a microtask so reading localStorage (and the resulting
    // state update) doesn't happen synchronously inside the effect body.
    queueMicrotask(() => {
      try {
        const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as AccentTheme;
          setTheme(saved);
          applyTheme(saved);
          return;
        }
      } catch {
        // fall through to default
      }
      applyTheme(DEFAULT_THEME);
    });
  }, []);

  function persist(next: AccentTheme) {
    setTheme(next);
    applyTheme(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // localStorage unavailable — theme still applies for this session
    }
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setPreset: persist,
        setCustomAccent: (hex: string) => persist(deriveTheme(hex)),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export { ACCENT_PRESETS };
