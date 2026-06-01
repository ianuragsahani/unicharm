"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, MessageCircle, Smartphone, Bell, Check } from "lucide-react";
import { cn, formatNum } from "@/lib/utils";

const CHANNELS = [
  { v: "WHATSAPP", label: "WhatsApp", Icon: MessageCircle },
  { v: "EMAIL", label: "Email", Icon: Mail },
  { v: "SMS", label: "SMS", Icon: Smartphone },
  { v: "PUSH", label: "Push", Icon: Bell },
] as const;

type Brand = { id: string; name: string; color: string };
type Segment = { id: string; name: string; brandId: string; brandName: string; size: number };

export function CampaignForm({ brands, segments, defaultSegmentId }: { brands: Brand[]; segments: Segment[]; defaultSegmentId?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const initial = defaultSegmentId ? segments.find((s) => s.id === defaultSegmentId) : null;
  const [brandId, setBrandId] = useState(initial?.brandId ?? brands[0]?.id ?? "");
  const [channel, setChannel] = useState<(typeof CHANNELS)[number]["v"]>("WHATSAPP");
  const [segmentId, setSegmentId] = useState(initial?.id ?? "");
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("Hi {{name}},\n\nWe have a special offer for you. Use code WIN20 for 20% off.\n\n— The team");
  const [variantB, setVariantB] = useState("");
  const [enableAB, setEnableAB] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");

  const audience = segmentId ? segments.find((s) => s.id === segmentId) : null;
  const filtered = segments.filter((s) => s.brandId === brandId);

  function submit(status: "DRAFT" | "SCHEDULED") {
    start(async () => {
      const r = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId, name, channel, segmentId: segmentId || null, subject, body, status,
          variantA: enableAB ? JSON.stringify({ body }) : null,
          variantB: enableAB ? JSON.stringify({ body: variantB }) : null,
          scheduledAt: status === "SCHEDULED" && scheduledAt ? new Date(scheduledAt).toISOString() : null,
        }),
      });
      if (r.ok) { router.push("/campaigns"); router.refresh(); }
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader><CardTitle>Channel</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              {CHANNELS.map(({ v, label, Icon }) => {
                const active = channel === v;
                return (
                  <button
                    key={v}
                    onClick={() => setChannel(v)}
                    className={cn(
                      "relative flex flex-col items-center gap-1.5 rounded-xl border p-3 text-sm transition-all",
                      active ? "border-brand-600 bg-brand-50 text-brand-700" : "border-border hover:bg-zinc-50",
                    )}
                  >
                    {active && <motion.span layoutId="ch-pill" className="absolute right-1.5 top-1.5 text-brand-600"><Check size={12} /></motion.span>}
                    <Icon size={18} />
                    {label}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Audience</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Brand</Label>
              <select value={brandId} onChange={(e) => { setBrandId(e.target.value); setSegmentId(""); }} className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm">
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Segment</Label>
              <select value={segmentId} onChange={(e) => setSegmentId(e.target.value)} className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm">
                <option value="">Select segment…</option>
                {filtered.map((s) => <option key={s.id} value={s.id}>{s.name} ({formatNum(s.size)})</option>)}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Content</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Campaign name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Diwali Drop — VIP" />
            </div>
            {channel === "EMAIL" && (
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="A subject that earns the open" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Body — variables: {`{{name}}, {{first_name}}, {{order_id}}`}</Label>
              <Textarea rows={6} value={body} onChange={(e) => setBody(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <input id="ab" type="checkbox" checked={enableAB} onChange={(e) => setEnableAB(e.target.checked)} className="h-4 w-4 rounded border-border" />
              <Label htmlFor="ab" className="cursor-pointer">Enable A/B test</Label>
            </div>
            {enableAB && (
              <div className="space-y-1.5">
                <Label>Variant B body</Label>
                <Textarea rows={5} value={variantB} onChange={(e) => setVariantB(e.target.value)} placeholder="Alternative copy for variant B" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-xl bg-zinc-50 p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted">{channel}</p>
              {channel === "EMAIL" && subject && <p className="mt-1 text-sm font-semibold">{subject}</p>}
              <p className="mt-2 whitespace-pre-wrap text-xs text-zinc-700">{body || "(empty)"}</p>
            </div>
            <div className="mt-4 rounded-lg border border-border p-3 text-xs">
              <p className="text-muted">Audience reach</p>
              <p className="mt-1 text-lg font-semibold">{audience ? formatNum(audience.size) : "—"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Schedule</CardTitle><CardDescription>Or launch later</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" disabled={pending || !name || !brandId} onClick={() => submit("DRAFT")}>Save draft</Button>
              <Button disabled={pending || !name || !brandId || !segmentId} onClick={() => submit("SCHEDULED")}>{pending ? "Saving…" : "Schedule"}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
