import { Router } from "express";
import { db } from "../db.js";
import { requirePerm } from "../middleware/auth.js";
import { activeBrandIds, canAccessBrand } from "../lib/rbac.js";
import { predictChurn, smartSegmentSuggestion, analyzeSentiment, recommendProducts, predictLifecycle } from "../lib/ai.js";

export const aiRouter = Router();

// AI page bootstrap: churn risks + smart segments
aiRouter.get("/overview", requirePerm("ai.read"), async (req, res) => {
  const brandIds = activeBrandIds(req.user!, req.activeBrand);

  const allChurn = (await Promise.all(brandIds.map((b) => predictChurn(b, 8)))).flat();

  const suggestions = (
    await Promise.all(
      brandIds.map(async (b) => {
        const s = await smartSegmentSuggestion(b);
        const brand = await db.brand.findUnique({ where: { id: b } });
        return s.map((x) => ({ ...x, brandName: brand?.name ?? "—", color: brand?.color ?? "#888" }));
      }),
    )
  )
    .flat()
    .slice(0, 8);

  const top = allChurn.sort((a, b) => b.score - a.score).slice(0, 10);
  const churnRisk = (
    await Promise.all(
      top.map(async (c) => {
        const cust = await db.customer.findUnique({ where: { id: c.customerId }, include: { brand: true } });
        return cust ? { ...c, customer: cust } : null;
      }),
    )
  ).filter(Boolean);

  res.json({ churnRisk, suggestions, highRiskCount: allChurn.filter((c) => c.score > 0.7).length });
});

aiRouter.post("/sentiment", requirePerm("ai.read"), (req, res) => {
  res.json(analyzeSentiment(String(req.body?.text ?? "")));
});

aiRouter.get("/recommend", requirePerm("ai.read"), async (req, res) => {
  const user = req.user!;
  const customerId = req.query.customerId as string;
  if (!customerId) return res.status(400).json({ error: "customerId required" });
  const c = await db.customer.findUnique({ where: { id: customerId } });
  if (!c || !canAccessBrand(user, c.brandId)) return res.status(404).json({ error: "Not found" });
  const [products, lifecycle] = await Promise.all([recommendProducts(customerId), predictLifecycle(customerId)]);
  res.json({ products, lifecycle });
});
