/**
 * Board colour themes — the light/dark squares. Separate from the accent
 * colour (which tints highlights, buttons and glows) so the two can be mixed:
 * e.g. Cream & Red squares with an Emerald accent.
 *
 * Squares are deliberately mid-tone rather than near-black/near-white, so
 * both the white and the black pieces stay readable on both square colours.
 */
export type BoardTheme = { id: string; name: string; light: string; dark: string };

export const BOARD_PRESETS: BoardTheme[] = [
  { id: "midnight", name: "Midnight", light: "#d8d6e2", dark: "#1a1a24" }, // the original look
  { id: "cream-red", name: "Cream & Red", light: "#f3e6d0", dark: "#b5484f" },
  { id: "forest", name: "Forest", light: "#ebebd3", dark: "#6f9b6b" },
  { id: "walnut", name: "Walnut", light: "#efd9b4", dark: "#b58863" },
  { id: "ocean", name: "Ocean", light: "#dde6ec", dark: "#6f8fa8" },
  { id: "plum", name: "Plum", light: "#e6ddf0", dark: "#7b5ea7" },
];

export const DEFAULT_BOARD = BOARD_PRESETS[0];
export const BOARD_STORAGE_KEY = "chess-x:board-theme";

export function boardById(id: string | null | undefined): BoardTheme {
  return BOARD_PRESETS.find((b) => b.id === id) ?? DEFAULT_BOARD;
}