// Pure-CSS top hat overlay. Place on top of any avatar via absolute positioning.
const TopHat = ({ size = 40, className = "" }: { size?: number; className?: string }) => {
  const w = size;
  const h = size * 0.85;
  return (
    <svg
      viewBox="0 0 100 85"
      width={w}
      height={h}
      className={`pointer-events-none drop-shadow-md ${className}`}
      aria-hidden
    >
      {/* Brim */}
      <ellipse cx="50" cy="72" rx="46" ry="8" fill="#0a0a0a" />
      {/* Crown */}
      <rect x="22" y="12" width="56" height="58" fill="#0a0a0a" rx="2" />
      {/* Band */}
      <rect x="22" y="56" width="56" height="9" fill="#7c1d1d" />
      {/* Highlight */}
      <rect x="28" y="14" width="3" height="40" fill="#222" />
    </svg>
  );
};

export default TopHat;
