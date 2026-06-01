"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export const Stat = ({ label, value, delta, icon, className }: { label: string; value: string | number; delta?: { value: number; label?: string }; icon?: ReactNode; className?: string }) => {
  const pos = (delta?.value ?? 0) >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn("rounded-2xl border border-border bg-surface p-5 shadow-soft", className)}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">{value}</p>
        </div>
        {icon && <div className="rounded-lg bg-brand-50 p-2 text-brand-600">{icon}</div>}
      </div>
      {delta && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <span className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold", pos ? "bg-success/10 text-success" : "bg-danger/10 text-danger")}>
            {pos ? "↑" : "↓"} {Math.abs(delta.value).toFixed(1)}%
          </span>
          <span className="text-muted">{delta.label ?? "vs last period"}</span>
        </div>
      )}
    </motion.div>
  );
};
