import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { requirePerm } from "../middleware/auth.js";
import { activeBrandIds, canAccessBrand } from "../lib/rbac.js";
import { logAudit } from "../services/audit.js";

export const campaignsRouter = Router();

campaignsRouter.get("/", requirePerm("campaign.read"), async (req, res) => {
  const brandIds = activeBrandIds(req.user!, req.activeBrand);
  const campaigns = await db.campaign.findMany({
    where: { brandId: { in: brandIds } },
    orderBy: { updatedAt: "desc" },
    include: { brand: true },
  });
  res.json({ campaigns });
});

const CreateSchema = z.object({
  brandId: z.string().cuid(),
  name: z.string().min(1),
  channel: z.enum(["EMAIL", "SMS", "WHATSAPP", "PUSH"]),
  segmentId: z.string().nullable().optional(),
  subject: z.string().optional(),
  body: z.string().min(1),
  status: z.enum(["DRAFT", "SCHEDULED"]).default("DRAFT"),
  scheduledAt: z.string().datetime().nullable().optional(),
  variantA: z.string().nullable().optional(),
  variantB: z.string().nullable().optional(),
});

campaignsRouter.post("/", requirePerm("campaign.create"), async (req, res) => {
  const user = req.user!;
  const parsed = CreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });
  const data = parsed.data;
  if (!canAccessBrand(user, data.brandId)) return res.status(403).json({ error: "Forbidden" });
  const c = await db.campaign.create({ data: { ...data, scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null } });
  await logAudit({ userId: user.id, action: "campaign.create", entityType: "Campaign", entityId: c.id });
  res.status(201).json({ campaign: c });
});
