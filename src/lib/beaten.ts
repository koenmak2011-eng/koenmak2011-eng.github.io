// Shared cross-game tracker of which AI opponents the player has beaten.
// Each game stores its beaten ids under its own key. The final-boss screen
// reads all three to know if Abhay should be unlocked.

export type GameKey = "chess" | "checkers" | "tictactoe";

const KEYS: Record<GameKey, string> = {
  chess: "chess-beaten",
  checkers: "checkers-beaten",
  tictactoe: "tictactoe-beaten",
};

type Listener = () => void;
const listeners = new Set<Listener>();

export function loadBeaten(game: GameKey): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS[game]) || "[]");
  } catch {
    return [];
  }
}

export function saveBeaten(game: GameKey, ids: string[]) {
  localStorage.setItem(KEYS[game], JSON.stringify(ids));
  listeners.forEach((fn) => fn());
}

export function addBeaten(game: GameKey, id: string): string[] {
  const current = loadBeaten(game);
  if (current.includes(id)) return current;
  const next = [...current, id];
  saveBeaten(game, next);
  return next;
}

export function subscribeBeaten(fn: Listener): () => void {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => {
    if (Object.values(KEYS).includes(e.key || "")) fn();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}

// Final boss unlock = every required ID beaten across all 3 games.
export function isAbhayUnlocked(required: Record<GameKey, string[]>): boolean {
  return (Object.keys(required) as GameKey[]).every((game) => {
    const beaten = loadBeaten(game);
    return required[game].every((id) => beaten.includes(id));
  });
}

// Has the player won the Abhay final boss?
export function hasBeatenAbhay(): boolean {
  return localStorage.getItem("abhay-beaten") === "1";
}
export function markAbhayBeaten() {
  localStorage.setItem("abhay-beaten", "1");
  listeners.forEach((fn) => fn());
}
