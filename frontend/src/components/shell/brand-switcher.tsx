"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Layers } from "lucide-react";
import { useBrand } from "@/lib/brand-context";
import { cn } from "@/lib/utils";

export function BrandSwitcher() {
  const { brands, active, setActive } = useBrand();
  const [open, setOpen] = useState(false);

  const label = active === "ALL" ? "All brands" : active.name;
  const dot = active === "ALL" ? "linear-gradient(135deg, #E91E63, #03A9F4, #9C27B0, #FF9800)" : active.color;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:bg-zinc-50"
      >
        <span className="h-3 w-3 rounded-full" style={{ background: dot }} />
        {label}
        <ChevronDown size={14} className="text-muted" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 z-40 mt-1.5 w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-pop"
            >
              <button
                onClick={() => { setActive("ALL"); setOpen(false); }}
                className={cn("flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50", active === "ALL" && "bg-zinc-50")}
              >
                <Layers size={14} className="text-muted" />
                <span className="flex-1 text-left">All brands</span>
                {active === "ALL" && <Check size={14} className="text-brand-600" />}
              </button>
              <div className="h-px bg-border" />
              {brands.map((b) => {
                const isActive = active !== "ALL" && active.id === b.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => { setActive(b); setOpen(false); }}
                    className={cn("flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50", isActive && "bg-zinc-50")}
                  >
                    <span className="h-3 w-3 rounded-full" style={{ background: b.color }} />
                    <span className="flex-1 text-left">{b.name}</span>
                    {isActive && <Check size={14} className="text-brand-600" />}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
