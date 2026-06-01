"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";

export function JourneyStatusButton({ id, status }: { id: string; status: "DRAFT" | "ACTIVE" | "PAUSED" }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const next = status === "ACTIVE" ? "PAUSED" : "ACTIVE";
  const Icon = status === "ACTIVE" ? Pause : Play;
  const label = status === "ACTIVE" ? "Pause" : status === "PAUSED" ? "Resume" : "Activate";

  function toggle() {
    start(async () => {
      await fetch(`/api/journeys/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      router.refresh();
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={toggle} disabled={pending}>
      <Icon size={14} /> {pending ? "…" : label}
    </Button>
  );
}
