"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Result = { sentiment: "positive" | "neutral" | "negative"; score: number };

export function SentimentChecker() {
  const [text, setText] = useState("Love this product, amazing quality!");
  const [r, setR] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    const res = await fetch("/api/ai/sentiment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
    setR(await res.json());
    setLoading(false);
  }

  const color = r?.sentiment === "positive" ? "text-success" : r?.sentiment === "negative" ? "text-danger" : "text-muted";
  const bg = r?.sentiment === "positive" ? "bg-success/10" : r?.sentiment === "negative" ? "bg-danger/10" : "bg-zinc-100";

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-2">
        <Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} />
        <Button onClick={run} disabled={loading}>{loading ? "Analyzing…" : "Analyze"}</Button>
      </div>
      <AnimatePresence mode="wait">
        {r && (
          <motion.div
            key={r.sentiment}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`rounded-xl p-5 ${bg}`}
          >
            <p className="text-[10px] uppercase tracking-wider text-muted">Result</p>
            <p className={`mt-1 text-2xl font-semibold capitalize ${color}`}>{r.sentiment}</p>
            <p className="mt-1 text-xs text-muted">score: {r.score.toFixed(2)}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
