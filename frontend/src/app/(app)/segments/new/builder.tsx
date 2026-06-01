"use client";
import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Users } from "lucide-react";
import { formatNum } from "@/lib/utils";

type Cond = { field: string; op: string; value: string };
type Brand = { id: string; name: string; color: string };

const FIELDS = [
  { v: "lifecycle", label: "Lifecycle", ops: ["eq", "neq"], values: ["NEW", "ACTIVE", "VIP", "AT_RISK", "CHURNED"] },
  { v: "totalOrders", label: "Total orders", ops: ["gt", "gte", "lt", "lte", "eq"], type: "number" },
  { v: "cltv", label: "CLTV (₹)", ops: ["gt", "gte", "lt", "lte"], type: "number" },
  { v: "churnScore", label: "Churn score", ops: ["gt", "gte", "lt", "lte"], type: "number" },
  { v: "city", label: "City", ops: ["eq", "contains"], type: "text" },
  { v: "gender", label: "Gender", ops: ["eq"], values: ["F", "M"] },
  { v: "ageBand", label: "Age band", ops: ["eq"], values: ["18-24", "25-34", "35-44", "45-54", "55+"] },
  { v: "source", label: "Source", ops: ["eq"], values: ["website", "app", "whatsapp", "offline"] },
];

const OP_LABEL: Record<string, string> = {
  eq: "is", neq: "is not", gt: ">", gte: "≥", lt: "<", lte: "≤", contains: "contains", in: "in", starts_with: "starts with",
};

export function SegmentBuilder({ brands }: { brands: Brand[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [brandId, setBrandId] = useState(brands[0]?.id ?? "");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [conds, setConds] = useState<Cond[]>([{ field: "lifecycle", op: "eq", value: "ACTIVE" }]);
  const [previewSize, setPreviewSize] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (!brandId || conds.length === 0) return;
    const ctrl = new AbortController();
    setPreviewLoading(true);
    fetch("/api/segments/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandId, rules: { all: conds.map(coerce) } }),
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then((d) => setPreviewSize(d.count))
      .catch(() => {})
      .finally(() => setPreviewLoading(false));
    return () => ctrl.abort();
  }, [brandId, conds]);

  function addCond() {
    setConds([...conds, { field: "lifecycle", op: "eq", value: "ACTIVE" }]);
  }
  function rmCond(i: number) {
    setConds(conds.filter((_, idx) => idx !== i));
  }
  function update(i: number, patch: Partial<Cond>) {
    setConds(conds.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }

  function save() {
    start(async () => {
      const r = await fetch("/api/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, name, description, rules: { all: conds.map(coerce) } }),
      });
      if (r.ok) {
        const d = await r.json();
        router.push(`/segments`);
        router.refresh();
      }
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Definition</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Brand</Label>
              <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm">
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lapsing VIPs Mumbai" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this segment for?" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Rules — match ALL of</Label>
              <Button size="sm" variant="outline" onClick={addCond}><Plus size={12} /> Add</Button>
            </div>

            <AnimatePresence initial={false}>
              {conds.map((c, i) => {
                const meta = FIELDS.find((f) => f.v === c.field) ?? FIELDS[0];
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: -4, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -4, height: 0 }}
                    transition={{ duration: 0.18 }}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-zinc-50/40 p-2.5"
                  >
                    <select value={c.field} onChange={(e) => update(i, { field: e.target.value, op: "eq", value: "" })} className="h-8 rounded-md border border-border bg-surface px-2 text-sm">
                      {FIELDS.map((f) => <option key={f.v} value={f.v}>{f.label}</option>)}
                    </select>
                    <select value={c.op} onChange={(e) => update(i, { op: e.target.value })} className="h-8 rounded-md border border-border bg-surface px-2 text-sm">
                      {meta.ops.map((o) => <option key={o} value={o}>{OP_LABEL[o]}</option>)}
                    </select>
                    {meta.values ? (
                      <select value={c.value} onChange={(e) => update(i, { value: e.target.value })} className="h-8 rounded-md border border-border bg-surface px-2 text-sm">
                        <option value="">Select…</option>
                        {meta.values.map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    ) : (
                      <Input className="h-8 max-w-[180px]" type={meta.type ?? "text"} value={c.value} onChange={(e) => update(i, { value: e.target.value })} />
                    )}
                    <Button size="icon" variant="ghost" onClick={() => rmCond(i)} className="ml-auto h-8 w-8 text-danger"><Trash2 size={14} /></Button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Preview</CardTitle>
            <CardDescription>Live count as you build</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid h-32 place-items-center rounded-xl bg-gradient-to-br from-brand-50 to-zinc-50">
            {previewLoading ? (
              <div className="text-sm text-muted">Calculating…</div>
            ) : (
              <motion.div
                key={previewSize}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="text-center"
              >
                <p className="text-3xl font-bold tracking-tight text-brand-700">{previewSize === null ? "—" : formatNum(previewSize)}</p>
                <p className="text-xs text-muted">matching customers</p>
              </motion.div>
            )}
          </div>

          <Button onClick={save} disabled={!name || !brandId || conds.length === 0 || pending} className="mt-4 w-full">
            <Users size={14} /> {pending ? "Saving…" : "Save segment"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function coerce(c: Cond) {
  const meta = FIELDS.find((f) => f.v === c.field);
  const value = meta?.type === "number" ? parseFloat(c.value) : c.value;
  return { field: c.field, op: c.op, value };
}
