import { Chess } from "chess.js";

const PIECE_VALUES: Record<string, number> = {
  p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000,
};

// Piece-square tables for positional evaluation (from white's perspective)
const PAWN_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
  5,  5, 10, 25, 25, 10,  5,  5,
  0,  0,  0, 20, 20,  0,  0,  0,
  5, -5,-10,  0,  0,-10, -5,  5,
  5, 10, 10,-20,-20, 10, 10,  5,
  0,  0,  0,  0,  0,  0,  0,  0,
];

const KNIGHT_TABLE = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50,
];

const PST: Record<string, number[]> = {
  p: PAWN_TABLE,
  n: KNIGHT_TABLE,
};

function evaluate(game: Chess): number {
  const board = game.board();
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      const val = PIECE_VALUES[piece.type] || 0;
      const pst = PST[piece.type];
      const positional = pst
        ? piece.color === "w"
          ? pst[r * 8 + c]
          : pst[(7 - r) * 8 + c]
        : 0;
      score += (piece.color === "w" ? 1 : -1) * (val + positional);
    }
  }
  return score;
}

function minimax(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean
): number {
  if (depth === 0 || game.isGameOver()) {
    if (game.isCheckmate()) return maximizing ? -99999 : 99999;
    if (game.isDraw()) return 0;
    return evaluate(game);
  }

  const moves = game.moves();
  if (maximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      game.move(move);
      const val = minimax(game, depth - 1, alpha, beta, false);
      game.undo();
      maxEval = Math.max(maxEval, val);
      alpha = Math.max(alpha, val);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      game.move(move);
      const val = minimax(game, depth - 1, alpha, beta, true);
      game.undo();
      minEval = Math.min(minEval, val);
      beta = Math.min(beta, val);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export interface AIMoveResult {
  move: string;
  confidence: number; // 0-100
  wasBlunder: boolean;
}

export function getBestMove(game: Chess, depth = 3, elo = 1200): AIMoveResult | null {
  const moves = game.moves();
  if (moves.length === 0) return null;

  const effectiveDepth = Math.min(depth, 4);

  // ELO-based blunder chance
  const blunderChance = elo <= 200 ? 0.75 : elo <= 400 ? 0.5 : elo <= 800 ? 0.2 : 0;
  if (Math.random() < blunderChance) {
    return {
      move: moves[Math.floor(Math.random() * moves.length)],
      confidence: Math.floor(Math.random() * 30 + 5), // 5-35%
      wasBlunder: true,
    };
  }

  const isWhite = game.turn() === "w";
  let bestMove = moves[0];
  let bestVal = isWhite ? -Infinity : Infinity;
  let secondBestVal = bestVal;

  const orderedMoves = [...moves].sort((a, b) => {
    const aScore = (a.includes("x") ? 10 : 0) + (a.includes("+") ? 5 : 0);
    const bScore = (b.includes("x") ? 10 : 0) + (b.includes("+") ? 5 : 0);
    return bScore - aScore;
  });

  for (const move of orderedMoves) {
    game.move(move);
    const val = minimax(game, effectiveDepth - 1, -Infinity, Infinity, !isWhite);
    game.undo();

    if (isWhite ? val > bestVal : val < bestVal) {
      secondBestVal = bestVal;
      bestVal = val;
      bestMove = move;
    } else if (isWhite ? val > secondBestVal : val < secondBestVal) {
      secondBestVal = val;
    }
  }

  // Confidence: how much better the best move is vs second best + absolute position
  const gap = Math.abs(bestVal - secondBestVal);
  const positionStrength = Math.min(Math.abs(bestVal) / 500, 1); // normalize
  const confidence = Math.min(100, Math.floor(40 + gap / 10 + positionStrength * 30 + elo / 100));

  return { move: bestMove, confidence, wasBlunder: false };
}
