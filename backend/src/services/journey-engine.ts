// Journey runtime. Walks a stored journey graph per customer and executes
// nodes (wait/message/branch) against live customer data. Messages go through
// the provider stubs in ../lib/providers. Synchronous simulation: waits are
// logged, not slept — fine for a demo where there is no durable scheduler.
import { db } from "../db.js";
import { sendWhatsApp, sendEmail, sendSMS, sendPush } from "../lib/providers.js";
import { rulesToWhere, validateRules } from "../lib/segmentation.js";

type NodeType = "trigger" | "wait" | "message" | "branch";
type GraphNode = { id: string; type: NodeType; label: string; x?: number; y?: number; config?: Record<string, any> };
type GraphEdge = { id?: string; from: string; to: string; label?: string };
type Graph = { nodes: GraphNode[]; edges: GraphEdge[] };

const MAX_AUDIENCE = 200; // cap entries per run so a demo run stays bounded
const MAX_STEPS = 50; // graph-walk guard against cycles

export type CustomerRun = { customerId: string; name: string; path: string[]; sent: number; converted: boolean };
export type RunResult = {
  journeyId: string;
  name: string;
  trigger: string;
  dryRun: boolean;
  entered: number;
  messagesSent: number;
  conversions: number;
  customers: CustomerRun[];
};

export async function runJourney(journeyId: string, opts?: { dryRun?: boolean; limit?: number }): Promise<RunResult> {
  const journey = await db.journey.findUnique({ where: { id: journeyId } });
  if (!journey) throw new Error("Journey not found");

  const dryRun = opts?.dryRun ?? false;
  const limit = opts?.limit ?? MAX_AUDIENCE;
  const graph = safeParse<Graph>(journey.graph, { nodes: [], edges: [] });
  const triggerCfg = safeParse<Record<string, any>>(journey.triggerConfig, {});

  const audience = await resolveAudience(journey.brandId, journey.trigger, triggerCfg, limit);
  const start = graph.nodes.find((n) => n.type === "trigger") ?? graph.nodes[0];

  const result: RunResult = {
    journeyId, name: journey.name, trigger: journey.trigger, dryRun,
    entered: audience.length, messagesSent: 0, conversions: 0, customers: [],
  };

  if (start) {
    for (const cust of audience) {
      const walk = await walkGraph(graph, start, cust, dryRun);
      result.messagesSent += walk.sent;
      if (walk.converted) result.conversions += 1;
      result.customers.push({ customerId: cust.id, name: cust.name, path: walk.path, sent: walk.sent, converted: walk.converted });
    }
  }

  if (!dryRun) {
    await db.journey.update({
      where: { id: journeyId },
      data: { runs: { increment: result.entered }, conversions: { increment: result.conversions } },
    });
  }
  return result;
}

/** Run every ACTIVE journey for the given brands (or all). Used by /run-all + scheduler. */
export async function runActiveJourneys(opts?: { brandIds?: string[]; dryRun?: boolean }): Promise<RunResult[]> {
  const journeys = await db.journey.findMany({
    where: { status: "ACTIVE", ...(opts?.brandIds ? { brandId: { in: opts.brandIds } } : {}) },
  });
  const out: RunResult[] = [];
  for (const j of journeys) out.push(await runJourney(j.id, { dryRun: opts?.dryRun }));
  return out;
}

type Cust = { id: string; name: string; brandId: string; email: string | null; phone: string | null; lifecycle: string; cltv: number; totalOrders: number; churnScore: number };

async function resolveAudience(brandId: string, trigger: string, cfg: Record<string, any>, limit: number): Promise<Cust[]> {
  if (trigger === "SEGMENT_ENTRY" && cfg.segmentId) {
    const segment = await db.segment.findUnique({ where: { id: cfg.segmentId } });
    // Segments are rule-based; resolve membership live so the journey works
    // whether or not SegmentMember rows have been materialized.
    if (segment) {
      const rules = safeParse<unknown>(segment.rules, null);
      if (validateRules(rules)) {
        return db.customer.findMany({ where: { brandId, ...rulesToWhere(rules) }, take: limit }) as unknown as Promise<Cust[]>;
      }
    }
    const members = await db.segmentMember.findMany({
      where: { segmentId: cfg.segmentId, customer: { brandId } },
      include: { customer: true },
      take: limit,
    });
    return members.map((m) => m.customer as unknown as Cust);
  }

  if (trigger === "EVENT" && cfg.event) {
    const events = await db.event.findMany({
      where: { type: cfg.event, customer: { brandId } },
      include: { customer: true },
      orderBy: { occurredAt: "desc" },
      take: limit * 3,
    });
    const seen = new Set<string>();
    const out: Cust[] = [];
    for (const e of events) {
      if (seen.has(e.customerId)) continue;
      seen.add(e.customerId);
      out.push(e.customer as unknown as Cust);
      if (out.length >= limit) break;
    }
    if (out.length > 0) return out;
    // Seed data has no "signup"/"abandon_cart" events — fall back to the cohort
    // those triggers target so the journey still has an audience to run on.
    if (cfg.event === "signup") return brandCustomers(brandId, limit, { lifecycle: "NEW" });
    if (cfg.event === "abandon_cart") {
      const carts = await db.event.findMany({
        where: { type: "add_to_cart", customer: { brandId } }, include: { customer: true }, take: limit,
      });
      return carts.map((c) => c.customer as unknown as Cust);
    }
    return brandCustomers(brandId, limit);
  }

  // SCHEDULE (or unknown) → all brand customers
  return brandCustomers(brandId, limit);
}

function brandCustomers(brandId: string, limit: number, extra: Record<string, any> = {}): Promise<Cust[]> {
  return db.customer.findMany({ where: { brandId, ...extra }, take: limit }) as unknown as Promise<Cust[]>;
}

async function walkGraph(graph: Graph, start: GraphNode, cust: Cust, dryRun: boolean) {
  const path: string[] = [];
  const visited = new Set<string>();
  let sent = 0;
  let node: GraphNode | undefined = start;
  let guard = 0;

  while (node && guard++ < MAX_STEPS) {
    if (visited.has(node.id)) break;
    visited.add(node.id);
    path.push(`${node.type}:${node.label}`);

    if (node.type === "message") {
      if (!dryRun) await execMessage(node, cust);
      sent++;
    }

    const outgoing = graph.edges.filter((e) => e.from === node!.id);
    if (outgoing.length === 0) break;

    let nextEdge: GraphEdge;
    if (node.type === "branch") {
      const truthy = evalBranch(node.config, cust);
      const yes = outgoing.find((e) => (e.label ?? "").toLowerCase() === "yes");
      const no = outgoing.find((e) => (e.label ?? "").toLowerCase() === "no");
      nextEdge = truthy ? (yes ?? outgoing[0]) : (no ?? outgoing[1] ?? outgoing[0]);
    } else {
      nextEdge = outgoing[0];
    }
    node = graph.nodes.find((n) => n.id === nextEdge.to);
  }

  // Conversion proxy: customer received at least one touch and currently sits
  // in an engaged lifecycle state. Swap for real attribution when available.
  const converted = sent > 0 && (cust.lifecycle === "ACTIVE" || cust.lifecycle === "VIP");
  return { path, sent, converted };
}

async function execMessage(node: GraphNode, cust: Cust) {
  const cfg = node.config ?? {};
  const channel = String(cfg.channel ?? "WHATSAPP").toUpperCase();
  const to = cust.phone ?? cust.email ?? cust.id;
  try {
    if (channel === "WHATSAPP") {
      await sendWhatsApp({
        to, templateName: cfg.templateName ?? cfg.template ?? "welcome_v1",
        vars: { name: cust.name }, customerId: cust.id, brandId: cust.brandId,
      });
    } else if (channel === "EMAIL") {
      await sendEmail({ to, subject: cfg.subject ?? node.label, body: cfg.body ?? "", customerId: cust.id });
    } else if (channel === "SMS") {
      await sendSMS({ to, body: cfg.body ?? node.label, customerId: cust.id });
    } else if (channel === "PUSH") {
      await sendPush({ title: cfg.subject ?? node.label, body: cfg.body ?? "", customerId: cust.id });
    }
  } catch (err) {
    // A missing template shouldn't abort the whole run — log and continue.
    console.warn(`[journey] message node "${node.label}" failed: ${(err as Error).message}`);
  }
}

function evalBranch(cfg: Record<string, any> | undefined, cust: Cust): boolean {
  if (!cfg?.field) return false;
  const { field, op = "eq", value } = cfg;
  let actual: unknown;
  if (field === "lastMessageOpened") {
    // Deterministic engagement proxy: low churn risk → likely to open.
    actual = cust.churnScore < 0.5;
  } else {
    actual = (cust as any)[field];
  }
  return compare(actual, op, value);
}

function compare(actual: unknown, op: string, value: unknown): boolean {
  switch (op) {
    case "eq": return String(actual) === String(value);
    case "neq": return String(actual) !== String(value);
    case "gt": return Number(actual) > Number(value);
    case "gte": return Number(actual) >= Number(value);
    case "lt": return Number(actual) < Number(value);
    case "lte": return Number(actual) <= Number(value);
    default: return false;
  }
}

/**
 * Opt-in background scheduler. Off by default — set JOURNEY_SCHEDULER=on to
 * have the process run all ACTIVE journeys every JOURNEY_SCHEDULER_INTERVAL_MS
 * (default 60s). Left disabled normally so a dev server doesn't keep firing
 * (stubbed) messages on every tick. A production build would replace this with
 * a durable queue/cron worker.
 */
export function startJourneyScheduler(): void {
  if (process.env.JOURNEY_SCHEDULER !== "on") return;
  const interval = Number(process.env.JOURNEY_SCHEDULER_INTERVAL_MS ?? 60_000);
  console.log(`⏱️  Journey scheduler on — every ${interval}ms`);
  setInterval(() => {
    runActiveJourneys().catch((e) => console.error("[journey] scheduler error:", e));
  }, interval).unref();
}

function safeParse<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
}
