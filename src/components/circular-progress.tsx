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
  strokeWidth = 2,
  className,
}: CircularProgressProps) {
  const ratio = total > 0 ? Math.min(Math.max(value / total, 0), 1) : 0;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const fillRadius = Math.max(radius - strokeWidth * 1.3, 0);
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
        ratio === 0 && "text-muted/50",
        ratio > 0 && ratio < 1 && "text-blue-500",
        ratio >= 1 && "text-success",
        className,
      )}
    >
      {ratio > 0 &&
        (ratio >= 1 ? (
          <circle
            cx={center}
            cy={center}
            r={fillRadius}
            className="fill-current opacity-50"
          />
        ) : (
          <path d={sectorPath} className="fill-current opacity-60" />
        ))}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        className="stroke-current"
      />
    </svg>
  );
}
