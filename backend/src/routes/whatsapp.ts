import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { requirePerm } from "../middleware/auth.js";
import { activeBrandIds, canAccessBrand } from "../lib/rbac.js";
import { sendWhatsApp } from "../lib/providers.js";
import { logAudit } from "../services/audit.js";

export const whatsappRouter = Router();

whatsappRouter.get("/", async (req, res) => {
  const brandIds = activeBrandIds(req.user!, req.activeBrand);
  const [templates, recent, total, delivered, replies, sent24h] = await Promise.all([
    db.whatsAppTemplate.findMany({ where: { brandId: { in: brandIds } }, include: { brand: true }, orderBy: { createdAt: "desc" } }),
    db.message.findMany({ where: { channel: "WHATSAPP", customer: { brandId: { in: brandIds } } }, orderBy: { createdAt: "desc" }, take: 12, include: { customer: { include: { brand: true } } } }),
    db.message.count({ where: { channel: "WHATSAPP", customer: { brandId: { in: brandIds } } } }),
    db.message.count({ where: { channel: "WHATSAPP", status: { in: ["DELIVERED", "READ"] }, customer: { brandId: { in: brandIds } } } }),
    db.message.count({ where: { channel: "WHATSAPP", direction: "IN", customer: { brandId: { in: brandIds } } } }),
    db.message.count({ where: { channel: "WHATSAPP", customer: { brandId: { in: brandIds } }, createdAt: { gt: new Date(Date.now() - 24 * 3600000) } } }),
  ]);
  res.json({ templates, recent, stats: { total, delivered, replies, sent24h } });
});

const SendSchema = z.object({ customerId: z.string().cuid(), templateName: z.string(), vars: z.record(z.string()).optional() });

whatsappRouter.post("/send", requirePerm("whatsapp.send"), async (req, res) => {
  const user = req.user!;
  const parsed = SendSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });
  const data = parsed.data;
  const c = await db.customer.findUnique({ where: { id: data.customerId } });
  if (!c) return res.status(404).json({ error: "Customer not found" });
  if (!canAccessBrand(user, c.brandId)) return res.status(403).json({ error: "Forbidden" });
  if (!c.phone) return res.status(400).json({ error: "Customer has no phone" });
  const msg = await sendWhatsApp({ to: c.phone, templateName: data.templateName, vars: data.vars, customerId: c.id, brandId: c.brandId });
  await logAudit({ userId: user.id, action: "whatsapp.send", entityType: "Message", entityId: msg.id });
  res.json({ message: msg });
});
