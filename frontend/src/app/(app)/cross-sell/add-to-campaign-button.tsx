"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Check, Plus } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function AddToCampaignButton({ personId, brandSlug, brandName }: { personId: string; brandSlug: string; brandName: string }) {
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [added, setAdded] = useState(false);

  function add() {
    start(async () => {
      const r = await fetch("/api/cross-sell/add-to-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId, brandSlug }),
      });
      if (!r.ok) {
        toast({ variant: "error", title: "Could not add", description: await r.text() });
        return;
      }
      const data = await r.json();
      setAdded(true);
      toast({ variant: "success", title: "Added to campaign", description: `${data.campaign.name} · ${data.campaign.count} prospect(s)` });
    });
  }

  return (
    <Button size="sm" variant={added ? "ghost" : "outline"} disabled={pending || added} onClick={add}>
      {added ? <><Check size={14} /> Added</> : <><Plus size={14} /> {pending ? "Adding…" : "Add to campaign"}</>}
    </Button>
  );
}
