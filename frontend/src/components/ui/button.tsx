"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

const V: Record<Variant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-soft",
  secondary: "bg-surface text-zinc-900 border border-border hover:bg-zinc-50",
  ghost: "text-zinc-700 hover:bg-zinc-100",
  danger: "bg-danger text-white hover:bg-red-600 shadow-soft",
  outline: "border border-border bg-transparent hover:bg-zinc-50",
};
const S: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
  lg: "h-11 px-5 text-base",
  icon: "h-9 w-9",
};

type P = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size };
export const Button = React.forwardRef<HTMLButtonElement, P>(({ className, variant = "primary", size = "md", ...p }, ref) => (
  <button
    ref={ref}
    className={cn("inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none", V[variant], S[size], className)}
    {...p}
  />
));
Button.displayName = "Button";
