import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  size?: number;
  showName?: boolean;
  className?: string;
};

export function BrandLogo({ size = 28, showName = false, className }: BrandLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <img
        src="/logo.svg"
        alt={showName ? "" : BRAND.name}
        width={size}
        height={size}
        className="shrink-0 rounded-lg"
      />
      {showName && (
        <span className="text-[15px] font-semibold tracking-tight text-fg">
          {BRAND.name}
        </span>
      )}
    </span>
  );
}
