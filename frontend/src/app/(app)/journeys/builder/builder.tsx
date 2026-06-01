"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Zap, Clock, MessageCircle, GitFork, Plus, Trash2, Link2, Unlink, Save } from "lucide-react";
import { cn } from "@/lib/utils";

type NodeType = "trigger" | "wait" | "message" | "branch";
type Node = { id: string; type: NodeType; label: string; x: number; y: number; config?: Record<string, any> };
type Edge = { id: string; from: string; to: string; label?: string };
type Brand = { id: string; name: string; color: string };
type Segment = { id: string; name: string; brandId: string };
type Template = { id: string; name: string; brandId: string; category: string };

const PALETTE = [
  { type: "trigger" as const, label: "Trigger", Icon: Zap, color: "from-amber-500 to-orange-600" },
  { type: "wait" as const, label: "Wait", Icon: Clock, color: "from-zinc-500 to-zinc-600" },
  { type: "message" as const, label: "Message", Icon: MessageCircle, color: "from-brand-500 to-brand-700" },
  { type: "branch" as const, label: "Branch", Icon: GitFork, color: "from-cyan-500 to-blue-600" },
];

const EVENT_TYPES = ["signup", "page_view", "add_to_cart", "purchase", "app_open", "email_open", "whatsapp_click", "search", "subscribe", "abandon_cart"];
const WAIT_UNITS = [
  { v: "minutes", label: "minutes" },
  { v: "hours", label: "hours" },
  { v: "days", label: "days" },
];
const CHANNELS = ["WHATSAPP", "EMAIL", "SMS", "PUSH"];
const BRANCH_FIELDS = ["lifecycle", "cltv", "totalOrders", "churnScore", "lastMessageOpened"];
const BRANCH_OPS = ["eq", "neq", "gt", "lt", "gte", "lte"];

const cuid = () => Math.random().toString(36).slice(2, 10);

type Initial = {
  id?: string;
  brandId?: string;
  name?: string;
  trigger?: string;
  triggerConfig?: any;
  status?: "DRAFT" | "ACTIVE" | "PAUSED";
  graph?: { nodes: Node[]; edges: Edge[] };
};

export function JourneyBuilder({
  brands,
  segments,
  templates,
  initial,
}: {
  brands: Brand[];
  segments: Segment[];
  templates: Template[];
  initial?: Initial;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [brandId, setBrandId] = useState(initial?.brandId ?? brands[0]?.id ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [trigger, setTrigger] = useState(initial?.trigger ?? "EVENT");
  const [triggerConfig, setTriggerConfig] = useState<Record<string, any>>(initial?.triggerConfig ?? { event: "signup" });
  const [nodes, setNodes] = useState<Node[]>(
    initial?.graph?.nodes?.length
      ? initial.graph.nodes.map((n) => ({ ...n, config: n.config ?? {} }))
      : [{ id: cuid(), type: "trigger", label: "Trigger", x: 60, y: 80, config: { event: "signup" } }],
  );
  const [edges, setEdges] = useState<Edge[]>(initial?.graph?.edges ?? []);
  const [selected, setSelected] = useState<string | null>(null);
  const [linkingFrom, setLinkingFrom] = useState<string | null>(null);

  function addNode(type: NodeType) {
    const cols = Math.floor((nodes.length) / 4);
    const rows = nodes.length % 4;
    const n: Node = {
      id: cuid(),
      type,
      label: defaultLabel(type),
      x: 60 + cols * 200,
      y: 80 + rows * 90,
      config: defaultConfig(type),
    };
    setNodes([...nodes, n]);
    setSelected(n.id);
  }

  function rm(id: string) {
    setNodes(nodes.filter((n) => n.id !== id));
    setEdges(edges.filter((e) => e.from !== id && e.to !== id));
    if (selected === id) setSelected(null);
    if (linkingFrom === id) setLinkingFrom(null);
  }

  function patch(id: string, p: Partial<Node>) {
    setNodes(nodes.map((n) => (n.id === id ? { ...n, ...p, config: { ...(n.config ?? {}), ...(p.config ?? {}) } } : n)));
  }

  function patchConfig(id: string, key: string, value: any) {
    setNodes(nodes.map((n) => (n.id === id ? { ...n, config: { ...(n.config ?? {}), [key]: value } } : n)));
  }

  function clickNode(id: string) {
    if (linkingFrom) {
      if (linkingFrom !== id && !edges.some((e) => e.from === linkingFrom && e.to === id)) {
        setEdges([...edges, { id: cuid(), from: linkingFrom, to: id }]);
      }
      setLinkingFrom(null);
      setSelected(id);
    } else {
      setSelected(id);
    }
  }

  function startLink(id: string) {
    setLinkingFrom((cur) => (cur === id ? null : id));
  }

  function removeEdge(eid: string) {
    setEdges(edges.filter((e) => e.id !== eid));
  }

  function save(status: "DRAFT" | "ACTIVE") {
    start(async () => {
      const isEdit = !!initial?.id;
      const url = isEdit ? `/api/journeys/${initial.id}` : "/api/journeys";
      const method = isEdit ? "PATCH" : "POST";
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId, name, trigger, status,
          triggerConfig,
          graph: { nodes, edges },
        }),
      });
      if (r.ok) {
        router.push("/journeys");
        router.refresh();
      }
    });
  }

  const sel = nodes.find((n) => n.id === selected);
  const brandSegments = segments.filter((s) => s.brandId === brandId);
  const brandTemplates = templates.filter((t) => t.brandId === brandId);
  const W = Math.max(1100, (Math.max(...nodes.map((n) => n.x), 0) + 260));
  const H = Math.max(420, (Math.max(...nodes.map((n) => n.y), 0) + 120));

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr_320px]">
      {/* LEFT: palette + meta */}
      <Card>
        <CardHeader><CardTitle>Palette</CardTitle><CardDescription>Add nodes to flow</CardDescription></CardHeader>
        <CardContent className="space-y-2">
          {PALETTE.map((p) => (
            <button key={p.type} onClick={() => addNode(p.type)} className={`flex w-full items-center gap-2 rounded-lg bg-gradient-to-br ${p.color} px-3 py-2 text-sm text-white shadow-soft hover:scale-[1.02] transition-transform`}>
              <p.Icon size={14} /> {p.label} <Plus size={12} className="ml-auto opacity-70" />
            </button>
          ))}

          <div className="pt-3 space-y-2 text-xs">
            <p className="font-semibold uppercase tracking-wider text-muted">Properties</p>
            <div>
              <Label>Brand</Label>
              <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm">
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <Label>Name</Label>
              <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Onboarding" />
            </div>
            <div>
              <Label>Trigger type</Label>
              <select value={trigger} onChange={(e) => { setTrigger(e.target.value); setTriggerConfig(e.target.value === "EVENT" ? { event: "signup" } : e.target.value === "SEGMENT_ENTRY" ? { segmentId: brandSegments[0]?.id } : { schedule: "0 9 * * *" }); }} className="mt-1 h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm">
                <option value="EVENT">Event-based</option>
                <option value="SEGMENT_ENTRY">Segment entry</option>
                <option value="SCHEDULE">Schedule (cron)</option>
              </select>
            </div>
            <TriggerConfig
              trigger={trigger}
              config={triggerConfig}
              onChange={setTriggerConfig}
              segments={brandSegments}
            />
          </div>
        </CardContent>
      </Card>

      {/* CENTER: canvas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Canvas</CardTitle>
            {linkingFrom && (
              <button onClick={() => setLinkingFrom(null)} className="text-xs text-warning hover:underline">
                Click target node to connect, or cancel
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-auto rounded-xl bg-zinc-50/60" style={{ maxHeight: 520 }}>
            <svg width={W} height={H}>
              <defs>
                <marker id="arrow2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(220 9% 46%)" />
                </marker>
                <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1" fill="hsl(220 13% 86%)" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dots)" />
              {edges.map((e) => {
                const a = nodes.find((n) => n.id === e.from);
                const b = nodes.find((n) => n.id === e.to);
                if (!a || !b) return null;
                const x1 = a.x + 80, y1 = a.y + 30, x2 = b.x, y2 = b.y + 30, mx = (x1 + x2) / 2;
                return (
                  <g key={e.id} className="cursor-pointer" onClick={() => removeEdge(e.id)}>
                    <path d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`} stroke="hsl(220 13% 60%)" strokeWidth={1.5} fill="none" markerEnd="url(#arrow2)" />
                    {e.label && (
                      <foreignObject x={mx - 30} y={(y1 + y2) / 2 - 10} width={60} height={20}>
                        <div className="text-center text-[10px] text-zinc-500 bg-zinc-50 rounded px-1">{e.label}</div>
                      </foreignObject>
                    )}
                  </g>
                );
              })}
              {nodes.map((n) => {
                const meta = PALETTE.find((p) => p.type === n.type) ?? PALETTE[0];
                const Icon = meta.Icon;
                const isSel = selected === n.id;
                const isLinkSource = linkingFrom === n.id;
                return (
                  <motion.g key={n.id} layout transform={`translate(${n.x}, ${n.y})`}>
                    <foreignObject width={170} height={60}>
                      <div
                        onClick={() => clickNode(n.id)}
                        className={cn(
                          `relative flex h-full w-full cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-br ${meta.color} px-3 py-2 text-white shadow-soft`,
                          isSel && "ring-2 ring-offset-2 ring-brand-500",
                          isLinkSource && "ring-2 ring-offset-2 ring-warning animate-pulse",
                        )}
                      >
                        <Icon size={16} className="shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] uppercase tracking-wider opacity-80">{n.type}</p>
                          <p className="truncate text-xs font-semibold">{n.label}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); startLink(n.id); }}
                          title="Connect to next node"
                          className="rounded p-0.5 text-white/80 hover:bg-white/20 hover:text-white"
                        >
                          {isLinkSource ? <Unlink size={12} /> : <Link2 size={12} />}
                        </button>
                      </div>
                    </foreignObject>
                  </motion.g>
                );
              })}
            </svg>
          </div>
          <p className="mt-2 text-[10px] text-muted">Tip: click the link icon on a node, then click another node to wire them. Click an edge to delete it.</p>
        </CardContent>
      </Card>

      {/* RIGHT: node properties */}
      <Card>
        <CardHeader>
          <CardTitle>{sel ? `Edit "${sel.label}"` : "Node properties"}</CardTitle>
          <CardDescription>{sel ? `Type: ${sel.type}` : "Select a node to configure"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!sel ? (
            <p className="text-sm text-muted">No node selected.</p>
          ) : (
            <>
              <div>
                <Label>Label</Label>
                <Input className="mt-1" value={sel.label} onChange={(e) => patch(sel.id, { label: e.target.value })} />
              </div>
              <NodeConfig
                node={sel}
                onChange={(k, v) => patchConfig(sel.id, k, v)}
                segments={brandSegments}
                templates={brandTemplates}
              />
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => startLink(sel.id)}>
                  {linkingFrom === sel.id ? "Cancel link" : "Connect →"}
                </Button>
                <Button variant="danger" size="sm" onClick={() => rm(sel.id)}><Trash2 size={12} /> Remove</Button>
              </div>
            </>
          )}

          <div className="border-t border-border pt-3 grid grid-cols-2 gap-2">
            <Button variant="outline" disabled={pending || !name || !brandId} onClick={() => save("DRAFT")}>
              <Save size={12} /> Save draft
            </Button>
            <Button disabled={pending || !name || !brandId} onClick={() => save("ACTIVE")}>
              {pending ? "…" : initial?.id ? "Update + Activate" : "Activate"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function defaultLabel(t: NodeType): string {
  switch (t) {
    case "trigger": return "Trigger";
    case "wait": return "Wait 1h";
    case "message": return "Send message";
    case "branch": return "Condition";
  }
}

function defaultConfig(t: NodeType): Record<string, any> {
  switch (t) {
    case "trigger": return { event: "signup" };
    case "wait": return { amount: 1, unit: "hours" };
    case "message": return { channel: "WHATSAPP", templateId: null, body: "" };
    case "branch": return { field: "lifecycle", op: "eq", value: "ACTIVE" };
  }
}

function TriggerConfig({ trigger, config, onChange, segments }: { trigger: string; config: any; onChange: (c: any) => void; segments: Segment[] }) {
  if (trigger === "EVENT") {
    return (
      <div>
        <Label>Event</Label>
        <select value={config.event ?? "signup"} onChange={(e) => onChange({ event: e.target.value })} className="mt-1 h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm">
          {EVENT_TYPES.map((ev) => <option key={ev}>{ev}</option>)}
        </select>
      </div>
    );
  }
  if (trigger === "SEGMENT_ENTRY") {
    return (
      <div>
        <Label>Segment</Label>
        <select value={config.segmentId ?? ""} onChange={(e) => onChange({ segmentId: e.target.value })} className="mt-1 h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm">
          <option value="">Select…</option>
          {segments.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
    );
  }
  return (
    <div>
      <Label>Cron (UTC)</Label>
      <Input className="mt-1" value={config.schedule ?? "0 9 * * *"} onChange={(e) => onChange({ schedule: e.target.value })} placeholder="0 9 * * *" />
      <p className="mt-0.5 text-[10px] text-muted">e.g. 0 9 * * * = daily at 9 AM</p>
    </div>
  );
}

function NodeConfig({ node, onChange, segments, templates }: { node: Node; onChange: (k: string, v: any) => void; segments: Segment[]; templates: Template[] }) {
  const cfg = node.config ?? {};
  switch (node.type) {
    case "trigger":
      return (
        <div>
          <Label>Event</Label>
          <select value={cfg.event ?? "signup"} onChange={(e) => onChange("event", e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm">
            {EVENT_TYPES.map((ev) => <option key={ev}>{ev}</option>)}
          </select>
        </div>
      );
    case "wait":
      return (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Amount</Label>
            <Input className="mt-1" type="number" min={1} value={cfg.amount ?? 1} onChange={(e) => onChange("amount", parseInt(e.target.value) || 1)} />
          </div>
          <div>
            <Label>Unit</Label>
            <select value={cfg.unit ?? "hours"} onChange={(e) => onChange("unit", e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm">
              {WAIT_UNITS.map((u) => <option key={u.v} value={u.v}>{u.label}</option>)}
            </select>
          </div>
        </div>
      );
    case "message":
      return (
        <div className="space-y-2">
          <div>
            <Label>Channel</Label>
            <select value={cfg.channel ?? "WHATSAPP"} onChange={(e) => onChange("channel", e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm">
              {CHANNELS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          {cfg.channel === "WHATSAPP" && (
            <div>
              <Label>Template</Label>
              <select value={cfg.templateId ?? ""} onChange={(e) => onChange("templateId", e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm">
                <option value="">Select…</option>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.category})</option>)}
              </select>
            </div>
          )}
          {cfg.channel !== "WHATSAPP" && (
            <div>
              <Label>Body</Label>
              <Textarea rows={3} value={cfg.body ?? ""} onChange={(e) => onChange("body", e.target.value)} />
            </div>
          )}
        </div>
      );
    case "branch":
      return (
        <div className="space-y-2">
          <div>
            <Label>Field</Label>
            <select value={cfg.field ?? "lifecycle"} onChange={(e) => onChange("field", e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm">
              {BRANCH_FIELDS.map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Op</Label>
              <select value={cfg.op ?? "eq"} onChange={(e) => onChange("op", e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm">
                {BRANCH_OPS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <Label>Value</Label>
              <Input className="mt-1" value={cfg.value ?? ""} onChange={(e) => onChange("value", e.target.value)} />
            </div>
          </div>
          <p className="text-[10px] text-muted">Tip: wire two outgoing edges from this node and set their labels to "yes"/"no" by clicking the edge.</p>
        </div>
      );
  }
}
