import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export const Empty = ({ icon, title, description, action, className }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode; className?: string }) => (
  <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center", className)}>
    {icon && <div className="mb-3 text-muted">{icon}</div>}
    <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
    {description && <p className="mt-1 text-xs text-muted max-w-xs">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
