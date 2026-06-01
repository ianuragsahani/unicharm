"use client";
import { motion } from "framer-motion";
import { formatNum, formatPct } from "@/lib/utils";

export function FunnelChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const top = data[0]?.value || 1;
  return (
    <div className="space-y-2">
      {data.map((d, i) => {
        const pct = d.value / top;
        const drop = i > 0 ? 1 - d.value / data[i - 1].value : 0;
        return (
          <div key={d.label}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">{d.label}</span>
              <span className="tabular-nums">{formatNum(d.value)} <span className="text-muted">· {formatPct(pct, 1)}</span></span>
            </div>
            <div className="mt-1 h-9 w-full rounded-lg bg-zinc-100 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct * 100}%` }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-lg flex items-center px-3 text-xs font-medium text-white"
                style={{ background: d.color }}
              >
                {pct > 0.15 && formatPct(pct, 1)}
              </motion.div>
            </div>
            {i > 0 && drop > 0 && (
              <p className="mt-0.5 text-[10px] text-danger">↓ {formatPct(drop)} drop-off</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
