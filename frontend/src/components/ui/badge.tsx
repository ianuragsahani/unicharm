import { cn } from "@/lib/utils";

type Variant = "default" | "success" | "warning" | "danger" | "info" | "outline";
const V: Record<Variant, string> = {
  default: "bg-zinc-100 text-zinc-700",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  info: "bg-brand-50 text-brand-700",
  outline: "border border-border text-zinc-700",
};

export const Badge = ({ variant = "default", className, ...p }: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) => (
  <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", V[variant], className)} {...p} />
);

export const LifecycleBadge = ({ value }: { value: string }) => {
  const map: Record<string, Variant> = { VIP: "info", ACTIVE: "success", AT_RISK: "warning", CHURNED: "danger", NEW: "default" };
  return <Badge variant={map[value] ?? "default"}>{value}</Badge>;
};
