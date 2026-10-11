import type { ReactNode } from "react";
import { CheckSquare } from "lucide-react";

type AuthCardProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-lg">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-white shadow-xs">
          <CheckSquare className="h-5 w-5" />
        </div>

        <h1 className="mt-4 text-center text-xl font-semibold text-fg">
          {title}
        </h1>
        <p className="mt-1 text-center text-sm text-muted">{subtitle}</p>

        {children}

        {footer && (
          <div className="mt-6 text-center text-sm text-muted">{footer}</div>
        )}
      </div>
    </div>
  );
}
