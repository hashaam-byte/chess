const KEY = "chess-x:device-key";

/** Random per-browser token used to prove "this device claimed that name". */
export function getDeviceKey(): string {
  if (typeof window === "undefined") return "";
  try {
    let k = window.localStorage.getItem(KEY);
    if (!k) {
      k = crypto.randomUUID();
      window.localStorage.setItem(KEY, k);
    }
    return k;
  } catch {
    return "";
  }
}