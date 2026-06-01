import { Router } from "express";
import { db } from "../db.js";
import { activeBrandIds } from "../lib/rbac.js";

export const analyticsRouter = Router();

analyticsRouter.get("/", async (req, res) => {
  const brandIds = activeBrandIds(req.user!, req.activeBrand);
  const [pageViews, addsToCart, purchases, totalCustomers, revenue, eventsByType, brandRevenue, brands] = await Promise.all([
    db.event.count({ where: { type: "page_view", customer: { brandId: { in: brandIds } } } }),
    db.event.count({ where: { type: "add_to_cart", customer: { brandId: { in: brandIds } } } }),
    db.order.count({ where: { customer: { brandId: { in: brandIds } } } }),
    db.customer.count({ where: { brandId: { in: brandIds } } }),
    db.order.aggregate({ where: { customer: { brandId: { in: brandIds } } }, _sum: { amount: true }, _avg: { amount: true } }),
    db.event.groupBy({ by: ["type"], where: { customer: { brandId: { in: brandIds } } }, _count: true }),
    db.customer.groupBy({ by: ["brandId"], where: { brandId: { in: brandIds } }, _sum: { cltv: true } }),
    db.brand.findMany({ where: { id: { in: brandIds } } }),
  ]);
  res.json({
    funnel: { pageViews, addsToCart, purchases },
    totalCustomers,
    revenue: { sum: revenue._sum.amount ?? 0, avg: revenue._avg.amount ?? 0 },
    eventsByType,
    brandRevenue,
    brands,
  });
});
