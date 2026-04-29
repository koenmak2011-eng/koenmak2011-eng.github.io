// Tic-Tac-Toe chaos engine. Board can grow from 3x3 to 5x5. Win condition
// adapts: 3-in-a-row up to 4x4, 4-in-a-row at 5x5+.

import { activateAmerica } from "./anthem";

export type Mark = "X" | "O" | null;

export interface TTTChaosResult {
  message: string;
  emoji: string;
  name: string;
  newBoard?: Mark[];
  newSize?: number;
  triggeredAmerica?: boolean;
}

function shuffleIdx(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function evtTTTGrow(board: Mark[], size: number): TTTChaosResult {
  const newSize = Math.min(size + 1, 5);
  if (newSize === size) {
    return { message: "The grid is already maxed out!", emoji: "📏", name: "BOARD GROW" };
  }
  // Re-layout: place old marks in top-left of new grid
  const newBoard: Mark[] = Array(newSize * newSize).fill(null);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      newBoard[r * newSize + c] = board[r * size + c];
    }
  }
  return {
    message: `The grid EXPANDS to ${newSize}x${newSize}! Win condition adapts!`,
    emoji: "📏",
    name: "BOARD GROW",
    newSize,
    newBoard,
  };
}

export function evtTTTSwap(board: Mark[]): TTTChaosResult {
  const xs = board.map((c, i) => (c === "X" ? i : -1)).filter((i) => i >= 0);
  const os = board.map((c, i) => (c === "O" ? i : -1)).filter((i) => i >= 0);
  if (!xs.length || !os.length) return { message: "Nothing to swap!", emoji: "🔀", name: "SWAP" };
  const xi = xs[Math.floor(Math.random() * xs.length)];
  const oi = os[Math.floor(Math.random() * os.length)];
  const nb = [...board];
  [nb[xi], nb[oi]] = [nb[oi], nb[xi]];
  return { message: "Two marks SWAPPED!", emoji: "🔀", name: "SWAP", newBoard: nb };
}

export function evtTTTErase(board: Mark[]): TTTChaosResult {
  const xs = board.map((c, i) => (c === "X" ? i : -1)).filter((i) => i >= 0);
  if (!xs.length) return { message: "Nothing to erase!", emoji: "🧽", name: "ERASE" };
  const idx = xs[Math.floor(Math.random() * xs.length)];
  const nb = [...board];
  nb[idx] = null;
  return { message: "One of your X's was ERASED!", emoji: "🧽", name: "ERASE", newBoard: nb };
}

export function evtTTTAmerica(): TTTChaosResult {
  activateAmerica();
  return {
    message: "🇺🇸 AMERICA. The anthem plays on loop for the rest of your session.",
    emoji: "🇺🇸",
    name: "AMERICA",
    triggeredAmerica: true,
  };
}

const CHAOS_CHANCE = 0.12;

export function rollTTTChaos(board: Mark[], size: number, opponentId: string): TTTChaosResult | null {
  if (Math.random() > CHAOS_CHANCE) return null;
  if (Math.random() < 0.07) return evtTTTAmerica();
  const pool = [
    (b: Mark[], s: number) => evtTTTGrow(b, s),
    (b: Mark[]) => evtTTTSwap(b),
    (b: Mark[]) => evtTTTErase(b),
  ];
  if (opponentId === "edward-tophat" || opponentId === "daniel") {
    pool.push((b) => evtTTTErase(b));
  }
  const fn = pool[Math.floor(Math.random() * pool.length)];
  return fn(board, size);
}

// Generic n-in-a-row checker for variable board sizes.
// Returns winning indices and mark, or null.
export function checkTTTWinner(
  board: Mark[],
  size: number,
): { winner: Mark; line: number[] | null } {
  const target = size <= 4 ? 3 : 4; // 3-in-a-row for 3x3 & 4x4, 4-in-a-row for 5x5
  const at = (r: number, c: number) => board[r * size + c];
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const m = at(r, c);
      if (!m) continue;
      for (const [dr, dc] of dirs) {
        const line: number[] = [];
        let ok = true;
        for (let k = 0; k < target; k++) {
          const nr = r + dr * k;
          const nc = c + dc * k;
          if (nr < 0 || nr >= size || nc < 0 || nc >= size || at(nr, nc) !== m) {
            ok = false;
            break;
          }
          line.push(nr * size + nc);
        }
        if (ok) return { winner: m, line };
      }
    }
  }
  return { winner: null, line: null };
}
