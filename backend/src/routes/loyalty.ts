import { Router } from "express";
import { db } from "../db.js";
import { requirePerm } from "../middleware/auth.js";
import { activeBrandIds } from "../lib/rbac.js";

export const loyaltyRouter = Router();

loyaltyRouter.get("/", async (req, res) => {
  const brandIds = activeBrandIds(req.user!, req.activeBrand);
  const [tierCounts, totalPoints, totalRedeemed, topMembers, tiers] = await Promise.all([
    db.loyaltyAccount.groupBy({ by: ["tier"], where: { customer: { brandId: { in: brandIds } } }, _count: true }),
    db.loyaltyAccount.aggregate({ where: { customer: { brandId: { in: brandIds } } }, _sum: { points: true, totalEarned: true } }),
    db.loyaltyAccount.aggregate({ where: { customer: { brandId: { in: brandIds } } }, _sum: { totalRedeemed: true } }),
    db.loyaltyAccount.findMany({ where: { customer: { brandId: { in: brandIds } } }, orderBy: { points: "desc" }, take: 10, include: { customer: { include: { brand: true } } } }),
    db.loyaltyTier.findMany({ where: { brandId: { in: brandIds } }, include: { brand: true }, orderBy: { order: "asc" } }),
  ]);
  res.json({ tierCounts, totalPoints, totalRedeemed, topMembers, tiers });
});
