import { cn } from "@/lib/utils";

type CircularProgressProps = {
  value: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
};

export function CircularProgress({
  value,
  total,
  size = 18,
  strokeWidth = 1.6,
  className,
}: CircularProgressProps) {
  const ratio = total > 0 ? Math.min(Math.max(value / total, 0), 1) : 0;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const fillRadius = Math.max(radius - strokeWidth * 1.6, 0);
  const endAngle = -Math.PI / 2 + ratio * Math.PI * 2;
  const endX = center + fillRadius * Math.cos(endAngle);
  const endY = center + fillRadius * Math.sin(endAngle);
  const sectorPath = [
    `M ${center} ${center}`,
    `L ${center} ${center - fillRadius}`,
    `A ${fillRadius} ${fillRadius} 0 ${ratio > 0.5 ? 1 : 0} 1 ${endX} ${endY}`,
    "Z",
  ].join(" ");

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="progressbar"
      aria-label={`${value} of ${total} completed`}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={value}
      className={cn(
        "shrink-0",
        ratio === 0 && "text-muted/60",
        ratio > 0 && ratio <= 0.5 && "text-blue-500",
        ratio > 0.5 && "text-success",
        className,
      )}
    >
      {ratio >= 1 ? (
        <>
          <circle cx={center} cy={center} r={center} className="fill-current" />
          <path
            d={`M ${size * 0.3} ${size * 0.52} L ${size * 0.44} ${size * 0.66} L ${size * 0.72} ${size * 0.36}`}
            fill="none"
            stroke="white"
            strokeWidth={Math.max(size * 0.12, 1.2)}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <>
          {ratio > 0 && (
            <path d={sectorPath} className="fill-current opacity-60" />
          )}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeDasharray={
              ratio === 0
                ? `${(2 * Math.PI * radius) / 14} ${(2 * Math.PI * radius) / 14}`
                : undefined
            }
            strokeLinecap={ratio === 0 ? "round" : undefined}
            className="stroke-current"
          />
        </>
      )}
    </svg>
  );
}
