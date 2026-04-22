import { useState, useCallback } from "react";
import { Chess, Square } from "chess.js";
import ChessPiece from "./ChessPiece";

interface ChessBoardProps {
  game: Chess;
  onMove: (from: Square, to: Square) => boolean;
}

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];

const ChessBoard = ({ game, onMove }: ChessBoardProps) => {
  const [selected, setSelected] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);

  const handleClick = useCallback(
    (square: Square) => {
      if (selected) {
        if (selected === square) {
          setSelected(null);
          setLegalMoves([]);
          return;
        }
        const success = onMove(selected, square);
        setSelected(null);
        setLegalMoves([]);
        if (!success) {
          // Try selecting the clicked square instead
          const piece = game.get(square);
          if (piece && piece.color === game.turn()) {
            setSelected(square);
            const moves = game.moves({ square, verbose: true });
            setLegalMoves(moves.map((m) => m.to as Square));
          }
        }
      } else {
        const piece = game.get(square);
        if (piece && piece.color === game.turn()) {
          setSelected(square);
          const moves = game.moves({ square, verbose: true });
          setLegalMoves(moves.map((m) => m.to as Square));
        }
      }
    },
    [selected, game, onMove]
  );

  return (
    <div className="inline-block rounded-lg overflow-hidden shadow-2xl border-4 border-primary/30">
      {RANKS.map((rank, ri) => (
        <div key={rank} className="flex">
          {FILES.map((file, fi) => {
            const square = (file + rank) as Square;
            const isLight = (ri + fi) % 2 === 0;
            const piece = game.get(square);
            const isSelected = selected === square;
            const isLegal = legalMoves.includes(square);

            return (
              <button
                key={square}
                onClick={() => handleClick(square)}
                className={`
                  w-14 h-14 md:w-[72px] md:h-[72px] flex items-center justify-center relative transition-colors duration-150
                  ${isLight ? "bg-board-light" : "bg-board-dark"}
                  ${isSelected ? "ring-4 ring-inset ring-accent z-10" : ""}
                  hover:brightness-110
                `}
              >
                {isLegal && (
                  <div
                    className={`absolute rounded-full ${
                      piece
                        ? "w-full h-full border-4 border-board-move/60"
                        : "w-4 h-4 bg-board-move/50"
                    }`}
                  />
                )}
                {piece && <ChessPiece type={piece.type} color={piece.color} />}
                {/* Coordinates */}
                {fi === 0 && (
                  <span className={`absolute top-0.5 left-1 text-[10px] font-bold ${isLight ? "text-board-dark/60" : "text-board-light/60"}`}>
                    {rank}
                  </span>
                )}
                {ri === 7 && (
                  <span className={`absolute bottom-0.5 right-1 text-[10px] font-bold ${isLight ? "text-board-dark/60" : "text-board-light/60"}`}>
                    {file}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default ChessBoard;
