"use client";
import { motion } from "framer-motion";

export function CohortGrid({ cohorts }: { cohorts: { cohort: string; retention: number[] }[] }) {
  return (
    <div className="space-y-1.5 overflow-x-auto">
      <div className="flex items-center gap-1.5 text-[10px] text-muted">
        <span className="w-20" />
        {cohorts[0]?.retention.map((_, i) => <span key={i} className="w-12 text-center">W{i}</span>)}
      </div>
      {cohorts.map((row, i) => (
        <div key={row.cohort} className="flex items-center gap-1.5">
          <span className="w-20 text-xs font-medium">{row.cohort}</span>
          {row.retention.map((v, j) => {
            const opacity = 0.15 + v * 0.85;
            return (
              <motion.div
                key={j}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, delay: 0.02 * (i * 6 + j) }}
                className="grid h-9 w-12 place-items-center rounded-md text-[11px] font-medium text-white"
                style={{ background: `hsl(259 88% 58% / ${opacity})` }}
              >
                {(v * 100).toFixed(0)}
              </motion.div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
