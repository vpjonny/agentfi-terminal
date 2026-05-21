export interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  /** Show a dot at the last point. */
  showLastPoint?: boolean;
  className?: string;
}

/**
 * Pure-SVG sparkline. No chart library, no client-only deps — safe inside
 * server components and tables.
 *
 * Auto-scales to the values' min/max. If all values are equal, draws a flat
 * line at vertical midpoint.
 */
export function Sparkline({
  values,
  width = 64,
  height = 20,
  stroke = "var(--ink-secondary)",
  showLastPoint = true,
  className,
}: SparklineProps) {
  if (values.length < 2) {
    return (
      <svg width={width} height={height} className={className} aria-hidden>
        <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke={stroke} strokeWidth={1} />
      </svg>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  // 1px padding top + bottom so dots/lines aren't clipped
  const pad = 2;
  const usableHeight = height - pad * 2;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = pad + usableHeight - ((v - min) / range) * usableHeight;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  const lastX = width;
  const lastY = pad + usableHeight - ((values[values.length - 1] - min) / range) * usableHeight;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden
    >
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={stroke}
        strokeWidth={1.25}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {showLastPoint && (
        <circle cx={lastX} cy={lastY} r={1.75} fill="var(--ink-primary)" />
      )}
    </svg>
  );
}
