const STORAGE_KEY = "chess-x:my-seats";

type SeatMap = Record<string, "white" | "black">;

function loadSeats(): SeatMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SeatMap) : {};
  } catch {
    return {};
  }
}

export function getMySeat(gameId: string): "white" | "black" | null {
  return loadSeats()[gameId] ?? null;
}

export function claimSeat(gameId: string, color: "white" | "black"): void {
  if (typeof window === "undefined") return;
  const seats = loadSeats();
  seats[gameId] = color;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seats));
}
