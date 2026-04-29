// Chaos events for Checkers. The board state is mutable (the page passes
// its `board`, `size`, `giants` references) — events return a description
// plus optional state updates the page applies.

import { activateAmerica } from "./anthem";

export interface CheckersChaosResult {
  message: string;
  emoji: string;
  name: string;
  // Optional state changes the caller will apply
  newSize?: number;
  newBoard?: number[][];
  newGiants?: Record<string, true>; // "r,c" => true = giant piece occupies (r,c) and (r+1,c+1) etc.
  triggeredAmerica?: boolean;
}

type Cell = number; // 0 empty | 1 player man | 2 ai man | 3 player king | 4 ai king

const ownerOf = (v: Cell): "p" | "a" | null =>
  v === 1 || v === 3 ? "p" : v === 2 || v === 4 ? "a" : null;

function shuffle<T>(a: T[]): T[] {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pieceCoords(board: Cell[][], side?: "p" | "a"): [number, number][] {
  const out: [number, number][] = [];
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      const v = board[r][c];
      if (v === 0) continue;
      if (side && ownerOf(v) !== side) continue;
      out.push([r, c]);
    }
  }
  return out;
}

// === Events ===

// Board grows by 2 in each dimension; existing pieces stay in their (r,c).
export function evtBoardGrow(board: Cell[][], size: number): CheckersChaosResult {
  const newSize = Math.min(size + 2, 12);
  if (newSize === size) {
    return { message: "The board groans but cannot grow further!", emoji: "📏", name: "BOARD GROW" };
  }
  const newBoard: Cell[][] = Array.from({ length: newSize }, () =>
    Array(newSize).fill(0) as Cell[]
  );
  // Copy old board into top-left of new board
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) newBoard[r][c] = board[r][c];
  return {
    message: `The board EXPANDS to ${newSize}x${newSize}! New territory opens up!`,
    emoji: "📏",
    name: "BOARD GROW",
    newSize,
    newBoard,
  };
}

// Pick a random AI piece, mark it as a 2x2 giant.
export function evtGiantPiece(
  board: Cell[][],
  giants: Record<string, true>,
  size: number,
): CheckersChaosResult {
  const candidates = pieceCoords(board, "a").filter(
    ([r, c]) => r + 1 < size && c + 1 < size && !giants[`${r},${c}`],
  );
  if (candidates.length === 0) {
    return { message: "No room to grow a giant!", emoji: "🦣", name: "GIANT PIECE" };
  }
  const [r, c] = candidates[Math.floor(Math.random() * candidates.length)];
  const newGiants = { ...giants, [`${r},${c}`]: true as const };
  // Clear the 2x2 footprint so the giant occupies it cleanly
  const newBoard = board.map((row) => row.slice());
  const piece = newBoard[r][c];
  newBoard[r][c] = piece;
  newBoard[r + 1]?.[c] !== undefined && (newBoard[r + 1][c] = 0);
  newBoard[r]?.[c + 1] !== undefined && (newBoard[r][c + 1] = 0);
  newBoard[r + 1]?.[c + 1] !== undefined && (newBoard[r + 1][c + 1] = 0);
  return {
    message: "A piece GROWS into a 2x2 GIANT! It now blocks 4 squares!",
    emoji: "🦣",
    name: "GIANT PIECE",
    newBoard,
    newGiants,
  };
}

// Swap two random pieces (one player, one ai)
export function evtSwap(board: Cell[][]): CheckersChaosResult {
  const players = pieceCoords(board, "p");
  const ais = pieceCoords(board, "a");
  if (!players.length || !ais.length) {
    return { message: "Nothing to swap!", emoji: "🔀", name: "SWAP" };
  }
  const [pr, pc] = players[Math.floor(Math.random() * players.length)];
  const [ar, ac] = ais[Math.floor(Math.random() * ais.length)];
  const newBoard = board.map((row) => row.slice());
  const tmp = newBoard[pr][pc];
  newBoard[pr][pc] = newBoard[ar][ac];
  newBoard[ar][ac] = tmp;
  return {
    message: "Two pieces SWAPPED across enemy lines!",
    emoji: "🔀",
    name: "SWAP",
    newBoard,
  };
}

// Random teleport of one ai piece to an empty square
export function evtTeleport(board: Cell[][], size: number): CheckersChaosResult {
  const ais = pieceCoords(board, "a");
  if (!ais.length) return { message: "Nobody to teleport!", emoji: "✨", name: "TELEPORT" };
  const empty: [number, number][] = [];
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) if (board[r][c] === 0 && (r + c) % 2 === 1) empty.push([r, c]);
  if (!empty.length) return { message: "No room to teleport!", emoji: "✨", name: "TELEPORT" };
  const [fr, fc] = ais[Math.floor(Math.random() * ais.length)];
  const [tr, tc] = empty[Math.floor(Math.random() * empty.length)];
  const newBoard = board.map((row) => row.slice());
  newBoard[tr][tc] = newBoard[fr][fc];
  newBoard[fr][fc] = 0;
  return {
    message: `A piece TELEPORTED across the board!`,
    emoji: "✨",
    name: "TELEPORT",
    newBoard,
  };
}

export function evtAmerica(): CheckersChaosResult {
  activateAmerica();
  return {
    message: "🇺🇸 AMERICA. The national anthem plays for the rest of your session.",
    emoji: "🇺🇸",
    name: "AMERICA",
    triggeredAmerica: true,
  };
}

const CHAOS_CHANCE = 0.08;

export function rollCheckersChaos(
  board: Cell[][],
  size: number,
  giants: Record<string, true>,
  opponentId: string,
): CheckersChaosResult | null {
  if (Math.random() > CHAOS_CHANCE) return null;
  // Pool varies slightly by opponent strength
  const pool: ((b: Cell[][], s: number, g: Record<string, true>) => CheckersChaosResult)[] = [
    (b, s) => evtBoardGrow(b, s),
    (b, s, g) => evtGiantPiece(b, g, s),
    (b) => evtSwap(b),
    (b, s) => evtTeleport(b, s),
  ];
  // 5% chance of America regardless of opponent
  if (Math.random() < 0.05) return evtAmerica();
  // Stronger opponents get extra teleport weight
  if (opponentId === "dragon" || opponentId === "edward-tophat" || opponentId === "daniel") {
    pool.push((b, s) => evtTeleport(b, s));
  }
  const fn = pool[Math.floor(Math.random() * pool.length)];
  return fn(board, size, giants);
}
