function clamp(n: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, n));
}

export function RadialProgress({
  value,
  size = 56,
  strokeWidth = 6,
  strokeColor = "stroke-muted-foreground",
  label,
}: {
  value: number;          // 0-100
  size?: number;          // px
  strokeWidth?: number;   // px
  strokeColor?: string;   // e.g., "stroke-"
  label?: string;         // e.g., "61%"
}) {
  const val = clamp(value);
  const rad = (size - strokeWidth) / 2;   // radius
  const cir = 2 * Math.PI * rad;          // circumference
  const dash = (val / 100) * cir;         // % of filled circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* -------------------------
        //* Full Circle
        //* ------------------------- */}
        <circle 
          cx={size / 2}
          cy={size / 2}
          r={rad}
          strokeWidth={strokeWidth}
          className="fill-none stroke-muted-foreground/20"
        />
        {/* -------------------------
        //* Filled Progress
        //* ------------------------- */}
        <circle 
          cx={size / 2}
          cy={size / 2}
          r={rad}
          strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${cir - dash}`}
          strokeLinecap="round"
          className={`fill-none ${strokeColor}`}
        />
      </svg>
      {/* -------------------------
      //* Center Label
      //* ------------------------- */}
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-sm font-semibold">
          {label ?? `${Math.round(val)}%`}
        </span>
      </div>
    </div>
  );
}