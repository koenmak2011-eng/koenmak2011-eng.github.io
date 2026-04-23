import { Chess, Square } from "chess.js";

const ALL_SQUARES: Square[] = [];
for (const file of "abcdefgh") {
  for (const rank of "12345678") {
    ALL_SQUARES.push((file + rank) as Square);
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface PlayerChaosOption {
  id: string;
  name: string;
  emoji: string;
  description: string;
  materialCost: number; // points of material (1=pawn, 3=knight/bishop, 5=rook, 9=queen)
  turnsGranted: number; // how many turns of chaos effect
  credits: number; // bonus credits saved for later
  execute: (game: Chess) => string;
}

// Player sacrifices 3 pawns (or equivalent) for 3 turns of random enemy piece removal
const chaosBomb: PlayerChaosOption = {
  id: "chaos-bomb",
  name: "Chaos Bomb",
  emoji: "💣",
  description: "Sacrifice 3 points of material to randomly remove an enemy piece each turn for 3 turns",
  materialCost: 3,
  turnsGranted: 3,
  credits: 0,
  execute: (game) => {
    const blackPieces = shuffle(
      ALL_SQUARES.filter(sq => {
        const p = game.get(sq);
        return p && p.color === "b" && p.type !== "k";
      })
    );
    if (blackPieces.length > 0) {
      const p = game.get(blackPieces[0]);
      game.remove(blackPieces[0]);
      return `💣 CHAOS BOMB! Removed enemy ${p?.type}!`;
    }
    return "💣 Chaos Bomb fizzled — no targets!";
  },
};

// Sacrifice a rook (5 pts) for 1 turn mega blast + 2 credits
const megaBlast: PlayerChaosOption = {
  id: "mega-blast",
  name: "Mega Blast",
  emoji: "🔥",
  description: "Sacrifice a rook (5 pts) to remove up to 3 enemy pieces instantly + save 2 credits",
  materialCost: 5,
  turnsGranted: 1,
  credits: 2,
  execute: (game) => {
    const blackPieces = shuffle(
      ALL_SQUARES.filter(sq => {
        const p = game.get(sq);
        return p && p.color === "b" && p.type !== "k";
      })
    );
    const count = Math.min(blackPieces.length, 3);
    for (let i = 0; i < count; i++) game.remove(blackPieces[i]);
    return `🔥 MEGA BLAST! Obliterated ${count} enemy pieces!`;
  },
};

// Sacrifice a queen (9 pts) for 3 turns of double chaos
const queenSacrifice: PlayerChaosOption = {
  id: "queen-sacrifice",
  name: "Queen's Gambit",
  emoji: "👑",
  description: "Sacrifice your queen (9 pts) for 3 turns of removing 2 enemy pieces per turn",
  materialCost: 9,
  turnsGranted: 3,
  credits: 0,
  execute: (game) => {
    const blackPieces = shuffle(
      ALL_SQUARES.filter(sq => {
        const p = game.get(sq);
        return p && p.color === "b" && p.type !== "k";
      })
    );
    const count = Math.min(blackPieces.length, 2);
    for (let i = 0; i < count; i++) game.remove(blackPieces[i]);
    return `👑 QUEEN'S GAMBIT! Destroyed ${count} enemy pieces!`;
  },
};

// Sacrifice a knight (3 pts) for spawning 2 pawns for yourself
const knightSpawn: PlayerChaosOption = {
  id: "knight-spawn",
  name: "Knight's Gift",
  emoji: "🐴",
  description: "Sacrifice a knight (3 pts) to spawn 2 white pawns on random empty squares",
  materialCost: 3,
  turnsGranted: 1,
  credits: 0,
  execute: (game) => {
    const emptySquares = shuffle(
      ALL_SQUARES.filter(sq => {
        const rank = parseInt(sq[1]);
        return !game.get(sq) && rank >= 2 && rank <= 6;
      })
    );
    const count = Math.min(emptySquares.length, 2);
    for (let i = 0; i < count; i++) {
      game.put({ type: "p", color: "w" }, emptySquares[i]);
    }
    return `🐴 Knight's Gift! Spawned ${count} white pawns!`;
  },
};

export const PLAYER_CHAOS_OPTIONS: PlayerChaosOption[] = [
  chaosBomb,
  megaBlast,
  queenSacrifice,
  knightSpawn,
];

// Calculate player's available material to sacrifice
export function getPlayerMaterial(game: Chess): number {
  const vals: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };
  let total = 0;
  for (const sq of ALL_SQUARES) {
    const p = game.get(sq);
    if (p && p.color === "w" && p.type !== "k") {
      total += vals[p.type] || 0;
    }
  }
  return total;
}

// Remove material from player's side to pay for chaos
export function payMaterialCost(game: Chess, cost: number): boolean {
  const vals: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };
  const whitePieces = ALL_SQUARES
    .filter(sq => {
      const p = game.get(sq);
      return p && p.color === "w" && p.type !== "k";
    })
    .map(sq => ({ sq, piece: game.get(sq)!, value: vals[game.get(sq)!.type] || 0 }))
    .sort((a, b) => a.value - b.value); // sacrifice cheapest first

  let paid = 0;
  for (const { sq, value } of whitePieces) {
    if (paid >= cost) break;
    game.remove(sq);
    paid += value;
  }
  return paid >= cost;
}
