// Shared crown wallet across all arcade games
const KEY = "chess-crowns"; // keep existing key so progress isn't lost

type Listener = (crowns: number) => void;
const listeners = new Set<Listener>();

export function loadCrowns(): number {
  try {
    return parseInt(localStorage.getItem(KEY) || "0", 10) || 0;
  } catch {
    return 0;
  }
}

export function saveCrowns(value: number) {
  try {
    localStorage.setItem(KEY, String(value));
  } catch {
    /* ignore */
  }
  listeners.forEach((fn) => fn(value));
}

export function addCrowns(delta: number): number {
  const next = Math.max(0, loadCrowns() + delta);
  saveCrowns(next);
  return next;
}

export function subscribeCrowns(fn: Listener): () => void {
  listeners.add(fn);
  // also react to other tabs / direct localStorage edits
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) fn(loadCrowns());
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}
