import { Chess, Square } from "chess.js";

const ALL_SQUARES: Square[] = [];
for (const file of "abcdefgh") {
  for (const rank of "12345678") {
    ALL_SQUARES.push((file + rank) as Square);
  }
}

function getOccupiedSquares(game: Chess, filter?: { color?: "w" | "b"; excludeKing?: boolean }) {
  return ALL_SQUARES.filter((sq) => {
    const p = game.get(sq);
    if (!p) return false;
    if (filter?.color && p.color !== filter.color) return false;
    if (filter?.excludeKing && p.type === "k") return false;
    return true;
  });
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface ChaosEvent {
  name: string;
  emoji: string;
  description: string;
  execute: (game: Chess) => string; // returns flavor text
}

// Arthur: Board Bite — eats 1-3 random pieces (any side, not kings) permanently
const arthurBoardBite: ChaosEvent = {
  name: "BOARD BITE",
  emoji: "🍽️",
  description: "Arthur takes a bite out of the board!",
  execute: (game) => {
    const targets = shuffle(getOccupiedSquares(game, { excludeKing: true }));
    const count = Math.min(targets.length, Math.floor(Math.random() * 3) + 1);
    const eaten: string[] = [];
    for (let i = 0; i < count; i++) {
      const p = game.get(targets[i]);
      if (p) eaten.push(`${p.color === "w" ? "white" : "black"} ${p.type}`);
      game.remove(targets[i]);
    }
    return `Arthur ate ${count} piece${count > 1 ? "s" : ""} off the board! OM NOM NOM 🍽️`;
  },
};

// Austen: Headphone Blast — pushes 1-3 enemy pieces back (toward rank 1 for white pieces)
const austenHeadphoneBlast: ChaosEvent = {
  name: "HEADPHONE BLAST",
  emoji: "🎧💥",
  description: "Austen blasts his headphones!",
  execute: (game) => {
    const whitePieces = shuffle(getOccupiedSquares(game, { color: "w", excludeKing: true }));
    const count = Math.min(whitePieces.length, Math.floor(Math.random() * 3) + 1);
    let moved = 0;
    for (let i = 0; i < count; i++) {
      const sq = whitePieces[i];
      const piece = game.get(sq);
      if (!piece) continue;
      const file = sq[0];
      const rank = parseInt(sq[1]);
      const pushBack = Math.floor(Math.random() * 3) + 1;
      const newRank = Math.max(1, rank - pushBack);
      if (newRank === rank) continue;
      const newSq = (file + newRank) as Square;
      const occupant = game.get(newSq);
      if (occupant && occupant.type === "k") continue;
      if (occupant) game.remove(newSq);
      game.remove(sq);
      game.put(piece, newSq);
      moved++;
    }
    return moved > 0
      ? `Austen's headphones BLAST your pieces back ${moved} piece${moved > 1 ? "s" : ""}! 🎧💥`
      : "Austen blasted his headphones but nothing happened!";
  },
};

// Austen: Maths — spawns up to 5 extra pawns for black on empty squares
const austenMaths: ChaosEvent = {
  name: "MATHS ATTACK",
  emoji: "📐🧮",
  description: "Austen does maths!",
  execute: (game) => {
    // Find empty squares on ranks 3-6 for pawn placement
    const emptySquares = shuffle(
      ALL_SQUARES.filter((sq) => {
        const rank = parseInt(sq[1]);
        return !game.get(sq) && rank >= 3 && rank <= 6;
      })
    );
    const count = Math.min(emptySquares.length, Math.floor(Math.random() * 5) + 1);
    for (let i = 0; i < count; i++) {
      game.put({ type: "p", color: "b" }, emptySquares[i]);
    }
    return `Austen calculated ${count} extra pawn${count > 1 ? "s" : ""} into existence! 📐🧮`;
  },
};

// William: Pterodactyl Attack — swoops and removes up to 3 of your pieces
const williamPterodactylAttack: ChaosEvent = {
  name: "PTERODACTYL ATTACK",
  emoji: "🦅💨",
  description: "William swoops in!",
  execute: (game) => {
    const whitePieces = shuffle(getOccupiedSquares(game, { color: "w", excludeKing: true }));
    const count = Math.min(whitePieces.length, Math.floor(Math.random() * 3) + 1);
    const stolen: string[] = [];
    for (let i = 0; i < count; i++) {
      const p = game.get(whitePieces[i]);
      if (p) stolen.push(p.type);
      game.remove(whitePieces[i]);
    }
    return `SCREEEECH! William swooped down and nabbed ${count} of your pieces! 🦅💨`;
  },
};

// Edward: Fighter Jet Bombing — bombs 1-2 random rows, kills all non-king pieces
const edwardFighterJet: ChaosEvent = {
  name: "FIGHTER JET STRIKE",
  emoji: "✈️💣",
  description: "Edward calls in an airstrike!",
  execute: (game) => {
    const rows = shuffle([1, 2, 3, 4, 5, 6, 7, 8]);
    const rowCount = Math.floor(Math.random() * 2) + 1;
    const bombed = rows.slice(0, rowCount);
    let kills = 0;
    for (const rank of bombed) {
      for (const file of "abcdefgh") {
        const sq = (file + rank) as Square;
        const p = game.get(sq);
        if (p && p.type !== "k") {
          game.remove(sq);
          kills++;
        }
      }
    }
    return `Fahhhhhhh... Edward's fighter jet bombed row${rowCount > 1 ? "s" : ""} ${bombed.join(" & ")}! ${kills} pieces obliterated! ✈️💣`;
  },
};

// Arthur Awakened: NUKE — destroys everything except kings and 1 random piece per side
const awakenedNuke: ChaosEvent = {
  name: "☢️ N U K E ☢️",
  emoji: "☢️",
  description: "Arthur ★ launches a NUKE!",
  execute: (game) => {
    const whitePieces = shuffle(getOccupiedSquares(game, { color: "w", excludeKing: true }));
    const blackPieces = shuffle(getOccupiedSquares(game, { color: "b", excludeKing: true }));
    // Keep 1 random piece per side alive
    const whiteSpared = whitePieces.length > 0 ? whitePieces[0] : null;
    const blackSpared = blackPieces.length > 0 ? blackPieces[0] : null;
    let kills = 0;
    for (const sq of [...whitePieces, ...blackPieces]) {
      if (sq === whiteSpared || sq === blackSpared) continue;
      game.remove(sq);
      kills++;
    }
    return `☢️ NUCLEAR LAUNCH DETECTED ☢️ Arthur ★ nuked the board! ${kills} pieces vaporized! Only the strongest survive...`;
  },
};

// Map opponent ID to their possible chaos events
const CHAOS_EVENTS: Record<string, ChaosEvent[]> = {
  arthur: [arthurBoardBite],
  austen: [austenHeadphoneBlast, austenMaths],
  william: [williamPterodactylAttack],
  edward: [edwardFighterJet],
  "arthur-awakened": [awakenedNuke],
};

const CHAOS_CHANCE = 0.05; // 5%

export function rollChaosEvent(
  game: Chess,
  opponentId: string
): { event: ChaosEvent; message: string } | null {
  if (Math.random() > CHAOS_CHANCE) return null;
  const events = CHAOS_EVENTS[opponentId];
  if (!events || events.length === 0) return null;
  const event = events[Math.floor(Math.random() * events.length)];
  const message = event.execute(game);
  return { event, message };
}
