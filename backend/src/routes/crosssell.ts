import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { requirePerm } from "../middleware/auth.js";
import { activeBrandIds, canAccessBrand } from "../lib/rbac.js";
import { findCrossSellOpportunities, brandOverlapMatrix } from "../lib/identity.js";
import { logAudit } from "../services/audit.js";

export const crossSellRouter = Router();

const AddSchema = z.object({
  personId: z.string().cuid(),
  brandSlug: z.string().min(1),
});

// Drop a cross-sell prospect into a draft campaign for the suggested brand.
// Reuses one rolling "Cross-sell prospects" DRAFT campaign per brand and bumps
// its target count, so repeated adds accumulate instead of spawning campaigns.
crossSellRouter.post("/add-to-campaign", requirePerm("campaign.create"), async (req, res) => {
  const user = req.user!;
  const parsed = AddSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const brand = await db.brand.findUnique({ where: { slug: parsed.data.brandSlug } });
  if (!brand) return res.status(404).json({ error: "Brand not found" });
  if (!canAccessBrand(user, brand.id)) return res.status(403).json({ error: "Forbidden" });

  const name = `${brand.name} – Cross-sell prospects`;
  const existing = await db.campaign.findFirst({ where: { brandId: brand.id, name, status: "DRAFT" } });
  const campaign = existing
    ? await db.campaign.update({ where: { id: existing.id }, data: { sent: { increment: 1 } } })
    : await db.campaign.create({
        data: {
          brandId: brand.id, name, channel: "WHATSAPP", status: "DRAFT",
          subject: "Cross-sell", body: "Cross-brand prospects sourced from the cross-sell engine.", sent: 1,
        },
      });

  await logAudit({ userId: user.id, action: "campaign.add_prospect", entityType: "Campaign", entityId: campaign.id, metadata: { personId: parsed.data.personId } });
  res.json({ campaign: { id: campaign.id, name: campaign.name, count: campaign.sent } });
});

crossSellRouter.get("/", async (req, res) => {
  const brandIds = activeBrandIds(req.user!, req.activeBrand);
  const [totalPersons, multiBrandPersons, multiBrandCLTV, opps, brands, matrix] = await Promise.all([
    db.person.count({ where: { customers: { some: { brandId: { in: brandIds } } } } }),
    db.person.count({ where: { brandCount: { gt: 1 }, customers: { some: { brandId: { in: brandIds } } } } }),
    db.person.aggregate({ where: { brandCount: { gt: 1 }, customers: { some: { brandId: { in: brandIds } } } }, _sum: { totalCLTV: true } }),
    findCrossSellOpportunities(brandIds, 30),
    db.brand.findMany(),
    brandOverlapMatrix(brandIds),
  ]);
  res.json({
    totalPersons,
    multiBrandPersons,
    multiBrandCLTV: multiBrandCLTV._sum.totalCLTV ?? 0,
    opps,
    brands,
    matrix,
  });
});
