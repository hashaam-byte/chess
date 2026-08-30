export type PieceType = "king" | "queen" | "rook" | "bishop" | "knight" | "pawn";

export type AvatarPreset = {
  id: string;
  piece: PieceType;
  from: string;
  to: string;
};

// Each avatar has a fixed identity color pair — deliberately independent of
// the site's customizable accent theme. If avatars followed the site theme,
// everyone's avatar would shift color together every time anyone picked a
// new accent, which defeats the point of an avatar being recognizably yours.
export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: "violet-king", piece: "king", from: "#A78BFA", to: "#6D28D9" },
  { id: "indigo-queen", piece: "queen", from: "#818CF8", to: "#4338CA" },
  { id: "blue-rook", piece: "rook", from: "#60A5FA", to: "#1D4ED8" },
  { id: "cyan-bishop", piece: "bishop", from: "#67E8F9", to: "#0E7490" },
  { id: "teal-knight", piece: "knight", from: "#5EEAD4", to: "#0F766E" },
  { id: "emerald-pawn", piece: "pawn", from: "#6EE7B7", to: "#047857" },
  { id: "amber-king", piece: "king", from: "#FCD34D", to: "#B45309" },
  { id: "orange-queen", piece: "queen", from: "#FDBA74", to: "#C2410C" },
  { id: "rose-rook", piece: "rook", from: "#FDA4AF", to: "#BE123C" },
  { id: "fuchsia-bishop", piece: "bishop", from: "#F0ABFC", to: "#A21CAF" },
  { id: "crimson-knight", piece: "knight", from: "#FCA5A5", to: "#991B1B" },
  { id: "slate-pawn", piece: "pawn", from: "#CBD5E1", to: "#475569" },
];

export const DEFAULT_AVATAR_ID = AVATAR_PRESETS[0].id;

export function getAvatarPreset(id: string | null | undefined): AvatarPreset {
  return AVATAR_PRESETS.find((a) => a.id === id) ?? AVATAR_PRESETS[0];
}
