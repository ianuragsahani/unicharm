"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Play, FlaskConical } from "lucide-react";

type RunResult = { entered: number; messagesSent: number; conversions: number; dryRun: boolean };

export function JourneyRunButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run(dryRun: boolean) {
    setError(null);
    start(async () => {
      const r = await fetch(`/api/journeys/${id}/run${dryRun ? "?dryRun=1" : ""}`, { method: "POST" });
      if (!r.ok) {
        setError("Run failed");
        return;
      }
      const data = await r.json();
      setResult(data.result as RunResult);
      if (!dryRun) router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" disabled={pending} onClick={() => run(true)}>
        <FlaskConical size={14} /> Simulate
      </Button>
      <Button size="sm" disabled={pending} onClick={() => run(false)}>
        <Play size={14} /> {pending ? "…" : "Run now"}
      </Button>
      {error && <span className="text-xs text-danger">{error}</span>}
      {result && !error && (
        <span className="text-xs text-muted">
          {result.dryRun ? "Sim: " : "Ran: "}
          {result.entered} entered · {result.messagesSent} sent · {result.conversions} conv.
        </span>
      )}
    </div>
  );
}
