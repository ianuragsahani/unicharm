import { Router } from "express";
import { db } from "../db.js";
import { activeBrandIds } from "../lib/rbac.js";

export const dashboardRouter = Router();

dashboardRouter.get("/", async (req, res) => {
  const brandIds = activeBrandIds(req.user!, req.activeBrand);
  const [totalCust, activeCust, vipCust, atRisk, revenueAgg, recentCust, campaigns, msgCount] = await Promise.all([
    db.customer.count({ where: { brandId: { in: brandIds } } }),
    db.customer.count({ where: { brandId: { in: brandIds }, lifecycle: "ACTIVE" } }),
    db.customer.count({ where: { brandId: { in: brandIds }, lifecycle: "VIP" } }),
    db.customer.count({ where: { brandId: { in: brandIds }, lifecycle: "AT_RISK" } }),
    db.customer.aggregate({ where: { brandId: { in: brandIds } }, _sum: { cltv: true }, _avg: { cltv: true } }),
    db.customer.findMany({ where: { brandId: { in: brandIds } }, orderBy: { createdAt: "desc" }, take: 6, include: { brand: true } }),
    db.campaign.findMany({ where: { brandId: { in: brandIds } }, orderBy: { updatedAt: "desc" }, take: 5, include: { brand: true } }),
    db.message.count({ where: { customer: { brandId: { in: brandIds } } } }),
  ]);
  res.json({
    totals: { totalCust, activeCust, vipCust, atRisk, msgCount },
    revenue: { total: revenueAgg._sum.cltv ?? 0, avg: revenueAgg._avg.cltv ?? 0 },
    recentCust,
    campaigns,
  });
});
