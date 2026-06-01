// Heuristic AI module. Swap with real models behind same interface.
import { db } from "../db.js";

export type ChurnRisk = { customerId: string; score: number; reason: string };

export async function predictChurn(brandId: string, limit = 50): Promise<ChurnRisk[]> {
  const c = await db.customer.findMany({ where: { brandId }, orderBy: { churnScore: "desc" }, take: limit });
  return c.map((x) => ({
    customerId: x.id,
    score: x.churnScore,
    reason: !x.lastOrderAt
      ? "Never purchased"
      : Date.now() - x.lastOrderAt.getTime() > 60 * 86400000
      ? "No purchase in 60d"
      : x.totalOrders < 2
      ? "Single-purchase customer"
      : "Declining engagement",
  }));
}

export async function predictLifecycle(customerId: string) {
  const c = await db.customer.findUnique({ where: { id: customerId } });
  if (!c) return null;
  const daysSince = c.lastOrderAt ? Math.floor((Date.now() - c.lastOrderAt.getTime()) / 86400000) : null;
  let next: string;
  if (c.lifecycle === "NEW") next = "ACTIVE";
  else if (c.lifecycle === "ACTIVE" && daysSince && daysSince > 45) next = "AT_RISK";
  else if (c.lifecycle === "AT_RISK" && daysSince && daysSince > 90) next = "CHURNED";
  else if (c.lifecycle === "ACTIVE" && c.cltv > 8000) next = "VIP";
  else next = c.lifecycle;
  return { current: c.lifecycle, predicted: next, daysSinceLastOrder: daysSince };
}

export async function recommendProducts(customerId: string) {
  const c = await db.customer.findUnique({ where: { id: customerId }, include: { brand: true } });
  if (!c) return [];
  const catalog: Record<string, string[]> = {
    sofy: ["Sofy Soft Bodyfit", "Sofy Antibacteria", "Sofy Overnight XL", "Sofy Pantyliner Daily"],
    mamypoko: ["MamyPoko Pants Extra Dry M", "MamyPoko Pants Standard L", "MamyPoko Pants Premium XL", "MamyPoko Wipes"],
    lifree: ["Lifree Slim L", "Lifree Underpants M", "Lifree Cleansing Sheets", "Lifree Bed Pads"],
    petcare: ["Pet Wet Wipes", "Pet Diapers M", "Pet Training Pads", "Pet Grooming Spray"],
  };
  const products = catalog[c.brand.slug] ?? [];
  return products.slice(0, 4).map((name, i) => ({ name, score: 0.95 - i * 0.12, reason: i === 0 ? "Frequently bought" : i === 1 ? "Lookalike cohort" : "Trending in your segment" }));
}

export async function smartSegmentSuggestion(brandId: string) {
  const counts = await db.customer.groupBy({ by: ["lifecycle"], where: { brandId }, _count: true, _avg: { cltv: true } });
  return counts.map((x) => ({
    name: `${x.lifecycle} cohort`,
    size: x._count,
    avgCLTV: x._avg.cltv ?? 0,
    suggested: x.lifecycle === "AT_RISK" ? "Send WhatsApp winback" : x.lifecycle === "VIP" ? "Send exclusive drop" : "Lifecycle nurture",
  }));
}

export function analyzeSentiment(text: string): { sentiment: "positive" | "neutral" | "negative"; score: number } {
  const pos = ["love", "great", "amazing", "happy", "good", "awesome", "best", "thanks"];
  const neg = ["bad", "hate", "terrible", "worst", "broken", "refund", "complaint", "angry"];
  const t = text.toLowerCase();
  const p = pos.reduce((a, w) => a + (t.includes(w) ? 1 : 0), 0);
  const n = neg.reduce((a, w) => a + (t.includes(w) ? 1 : 0), 0);
  if (p > n) return { sentiment: "positive", score: Math.min(1, p / 5) };
  if (n > p) return { sentiment: "negative", score: -Math.min(1, n / 5) };
  return { sentiment: "neutral", score: 0 };
}
