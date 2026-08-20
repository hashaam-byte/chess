export type AccentTheme = { name: string; accent: string; light: string; dark: string };

// Curated presets. "light"/"dark" are used for gradients and glows around
// the base accent — precomputed here so presets always look intentional.
export const ACCENT_PRESETS: AccentTheme[] = [
  { name: "Violet", accent: "#8B5CF6", light: "#A78BFA", dark: "#6D28D9" },
  { name: "Electric Blue", accent: "#6C63FF", light: "#938CFF", dark: "#4338CA" },
  { name: "Cyan", accent: "#22D3EE", light: "#67E8F9", dark: "#0E7490" },
  { name: "Emerald", accent: "#34D399", light: "#6EE7B7", dark: "#047857" },
  { name: "Crimson", accent: "#F43F5E", light: "#FB7185", dark: "#BE123C" },
  { name: "Amber", accent: "#F59E0B", light: "#FBBF24", dark: "#B45309" },
];

export const DEFAULT_THEME = ACCENT_PRESETS[0];

function clamp255(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => clamp255(v).toString(16).padStart(2, "0")).join("");
}

function mix(hex: string, withHex: string, amount: number): string {
  const [r1, g1, b1] = hexToRgb(hex);
  const [r2, g2, b2] = hexToRgb(withHex);
  return rgbToHex(r1 + (r2 - r1) * amount, g1 + (g2 - g1) * amount, b1 + (b2 - b1) * amount);
}

/** Derives light/dark variants for an arbitrary custom accent color. */
export function deriveTheme(accent: string, name = "Custom"): AccentTheme {
  return {
    name,
    accent,
    light: mix(accent, "#FFFFFF", 0.32),
    dark: mix(accent, "#000000", 0.32),
  };
}

export const THEME_STORAGE_KEY = "chess-x:theme";
