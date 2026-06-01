import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { requirePerm } from "../middleware/auth.js";
import { activeBrandIds, canAccessBrand } from "../lib/rbac.js";
import { rulesToWhere, validateRules, type RuleGroup } from "../lib/segmentation.js";
import { logAudit } from "../services/audit.js";

export const segmentsRouter = Router();

segmentsRouter.get("/", requirePerm("segment.read"), async (req, res) => {
  const brandIds = activeBrandIds(req.user!, req.activeBrand);
  const segments = await db.segment.findMany({
    where: { brandId: { in: brandIds } },
    orderBy: { updatedAt: "desc" },
    include: { brand: true },
  });
  res.json({ segments });
});

segmentsRouter.get("/:id", requirePerm("segment.read"), async (req, res) => {
  const user = req.user!;
  const s = await db.segment.findUnique({ where: { id: req.params.id }, include: { brand: true } });
  if (!s || !canAccessBrand(user, s.brandId)) return res.status(404).json({ error: "Not found" });
  const rules = JSON.parse(s.rules || "{}") as RuleGroup;
  const where = { brandId: s.brandId, ...rulesToWhere(rules) };
  const [members, count] = await Promise.all([
    db.customer.findMany({ where, take: 25, orderBy: { cltv: "desc" }, include: { brand: true } }),
    db.customer.count({ where }),
  ]);
  res.json({ segment: s, rules, members, count });
});

segmentsRouter.post("/preview", requirePerm("segment.read"), async (req, res) => {
  const user = req.user!;
  const { brandId, rules } = req.body;
  if (!canAccessBrand(user, brandId)) return res.status(403).json({ error: "Forbidden" });
  if (!validateRules(rules)) return res.json({ count: 0 });
  const count = await db.customer.count({ where: { brandId, ...rulesToWhere(rules) } });
  res.json({ count });
});

const CreateSchema = z.object({
  brandId: z.string().cuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  rules: z.object({ all: z.array(z.any()).optional(), any: z.array(z.any()).optional() }),
});

segmentsRouter.post("/", requirePerm("segment.create"), async (req, res) => {
  const user = req.user!;
  const parsed = CreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });
  const data = parsed.data;
  if (!canAccessBrand(user, data.brandId)) return res.status(403).json({ error: "Forbidden" });
  if (!validateRules(data.rules)) return res.status(400).json({ error: "Invalid rules" });
  const size = await db.customer.count({ where: { brandId: data.brandId, ...rulesToWhere(data.rules) } });
  const s = await db.segment.create({
    data: { brandId: data.brandId, name: data.name, description: data.description, rules: JSON.stringify(data.rules), size, createdById: user.id },
  });
  await logAudit({ userId: user.id, action: "segment.create", entityType: "Segment", entityId: s.id, metadata: { name: s.name, size } });
  res.status(201).json({ segment: s });
});
