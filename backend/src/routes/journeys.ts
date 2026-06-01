import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { requirePerm } from "../middleware/auth.js";
import { activeBrandIds, canAccessBrand } from "../lib/rbac.js";
import { logAudit } from "../services/audit.js";
import { runJourney, runActiveJourneys } from "../services/journey-engine.js";

export const journeysRouter = Router();

journeysRouter.get("/", requirePerm("journey.read"), async (req, res) => {
  const brandIds = activeBrandIds(req.user!, req.activeBrand);
  const journeys = await db.journey.findMany({
    where: { brandId: { in: brandIds } },
    orderBy: { updatedAt: "desc" },
    include: { brand: true },
  });
  res.json({ journeys });
});

journeysRouter.get("/:id", requirePerm("journey.read"), async (req, res) => {
  const user = req.user!;
  const j = await db.journey.findUnique({ where: { id: req.params.id }, include: { brand: true } });
  if (!j || !canAccessBrand(user, j.brandId)) return res.status(404).json({ error: "Not found" });
  res.json({ journey: j });
});

const CreateSchema = z.object({
  brandId: z.string().cuid(),
  name: z.string().min(1),
  trigger: z.string(),
  triggerConfig: z.record(z.any()).default({}),
  graph: z.object({ nodes: z.array(z.any()), edges: z.array(z.any()) }),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED"]).default("DRAFT"),
});

journeysRouter.post("/", requirePerm("journey.create"), async (req, res) => {
  const user = req.user!;
  const parsed = CreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });
  const data = parsed.data;
  if (!canAccessBrand(user, data.brandId)) return res.status(403).json({ error: "Forbidden" });
  const j = await db.journey.create({
    data: {
      brandId: data.brandId, name: data.name, trigger: data.trigger,
      triggerConfig: JSON.stringify(data.triggerConfig), graph: JSON.stringify(data.graph), status: data.status,
    },
  });
  await logAudit({ userId: user.id, action: "journey.create", entityType: "Journey", entityId: j.id });
  res.status(201).json({ journey: j });
});

const PatchSchema = z.object({
  brandId: z.string().cuid().optional(),
  name: z.string().min(1).optional(),
  trigger: z.string().optional(),
  triggerConfig: z.record(z.any()).optional(),
  graph: z.object({ nodes: z.array(z.any()), edges: z.array(z.any()) }).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED"]).optional(),
});

journeysRouter.patch("/:id", requirePerm("journey.update"), async (req, res) => {
  const user = req.user!;
  const existing = await db.journey.findUnique({ where: { id: req.params.id } });
  if (!existing || !canAccessBrand(user, existing.brandId)) return res.status(404).json({ error: "Not found" });
  const parsed = PatchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });
  const data = parsed.data;
  const updated = await db.journey.update({
    where: { id: req.params.id },
    data: {
      ...(data.brandId ? { brandId: data.brandId } : {}),
      ...(data.name ? { name: data.name } : {}),
      ...(data.trigger ? { trigger: data.trigger } : {}),
      ...(data.triggerConfig ? { triggerConfig: JSON.stringify(data.triggerConfig) } : {}),
      ...(data.graph ? { graph: JSON.stringify(data.graph) } : {}),
      ...(data.status ? { status: data.status } : {}),
    },
  });
  await logAudit({ userId: user.id, action: "journey.update", entityType: "Journey", entityId: req.params.id, metadata: { status: data.status } });
  res.json({ journey: updated });
});

journeysRouter.delete("/:id", requirePerm("journey.delete"), async (req, res) => {
  const user = req.user!;
  const existing = await db.journey.findUnique({ where: { id: req.params.id } });
  if (!existing || !canAccessBrand(user, existing.brandId)) return res.status(404).json({ error: "Not found" });
  await db.journey.delete({ where: { id: req.params.id } });
  await logAudit({ userId: user.id, action: "journey.delete", entityType: "Journey", entityId: req.params.id });
  res.json({ ok: true });
});

// Execute a journey now. ?dryRun=1 (or { dryRun: true }) simulates without
// sending or mutating stats — useful for previewing the audience + paths.
journeysRouter.post("/:id/run", requirePerm("journey.update"), async (req, res) => {
  const user = req.user!;
  const existing = await db.journey.findUnique({ where: { id: req.params.id } });
  if (!existing || !canAccessBrand(user, existing.brandId)) return res.status(404).json({ error: "Not found" });
  const dryRun = req.query.dryRun === "1" || req.body?.dryRun === true;
  const result = await runJourney(req.params.id, { dryRun });
  await logAudit({
    userId: user.id, action: dryRun ? "journey.simulate" : "journey.run",
    entityType: "Journey", entityId: req.params.id,
    metadata: { entered: result.entered, sent: result.messagesSent, conversions: result.conversions },
  });
  res.json({ result });
});

// Execute every ACTIVE journey the user can reach (respects X-Active-Brand).
journeysRouter.post("/run-all", requirePerm("journey.update"), async (req, res) => {
  const user = req.user!;
  const brandIds = activeBrandIds(user, req.activeBrand);
  const dryRun = req.query.dryRun === "1" || req.body?.dryRun === true;
  const results = await runActiveJourneys({ brandIds, dryRun });
  await logAudit({
    userId: user.id, action: dryRun ? "journey.simulate_all" : "journey.run_all",
    entityType: "Journey", metadata: { journeys: results.length },
  });
  res.json({ results });
});

// builder bootstrap data: segments + templates (+ optional existing journey)
journeysRouter.get("/builder/data", requirePerm("journey.read"), async (req, res) => {
  const user = req.user!;
  const brandIds = activeBrandIds(user, req.activeBrand);
  const id = req.query.id as string | undefined;
  const [segments, templates, existing] = await Promise.all([
    db.segment.findMany({ where: { brandId: { in: brandIds } }, select: { id: true, name: true, brandId: true } }),
    db.whatsAppTemplate.findMany({ where: { brandId: { in: brandIds } }, select: { id: true, name: true, brandId: true, category: true } }),
    id ? db.journey.findUnique({ where: { id } }) : Promise.resolve(null),
  ]);
  if (existing && !user.brands.some((b) => b.id === existing.brandId)) return res.status(403).json({ error: "Forbidden" });
  res.json({ segments, templates, existing });
});
