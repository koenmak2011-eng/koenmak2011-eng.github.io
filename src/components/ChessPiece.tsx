const PIECE_UNICODE: Record<string, string> = {
  wp: "♙", wn: "♘", wb: "♗", wr: "♖", wq: "♕", wk: "♔",
  bp: "♟", bn: "♞", bb: "♝", br: "♜", bq: "♛", bk: "♚",
};

interface ChessPieceProps {
  type: string; // p, n, b, r, q, k
  color: "w" | "b";
}

const ChessPiece = ({ type, color }: ChessPieceProps) => {
  const key = color + type;
  return (
    <span className="text-4xl md:text-5xl select-none drop-shadow-md cursor-grab active:cursor-grabbing leading-none">
      {PIECE_UNICODE[key] || ""}
    </span>
  );
};

export default ChessPiece;
