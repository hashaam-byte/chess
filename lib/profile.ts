import { DEFAULT_AVATAR_ID } from "./avatars";

export type Profile = {
  name: string;
  avatarId: string;
};

const STORAGE_KEY = "chess-x:profile";

export function getProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: Profile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function blankProfile(): Profile {
  return { name: "", avatarId: DEFAULT_AVATAR_ID };
}
