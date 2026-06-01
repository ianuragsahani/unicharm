import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { requirePerm } from "../middleware/auth.js";
import { activeBrandIds, canAccessBrand } from "../lib/rbac.js";
import { logAudit } from "../services/audit.js";
import { predictLifecycle, recommendProducts } from "../lib/ai.js";

export const customersRouter = Router();

// List (paginated + filter)
customersRouter.get("/", requirePerm("customer.read"), async (req, res) => {
  const user = req.user!;
  const brandIds = activeBrandIds(user, req.activeBrand);
  const q = (req.query.q as string)?.trim();
  const lifecycle = req.query.lifecycle as string | undefined;
  const page = Math.max(1, parseInt((req.query.page as string) ?? "1"));
  const take = Math.min(10000, parseInt((req.query.take as string) ?? "25"));
  const skip = (page - 1) * take;

  const where = {
    brandId: { in: brandIds },
    ...(lifecycle ? { lifecycle } : {}),
    ...(q
      ? { OR: [{ name: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }, { externalId: { contains: q } }] }
      : {}),
  } as const;

  const [customers, total] = await Promise.all([
    db.customer.findMany({ where, orderBy: { createdAt: "desc" }, take, skip, include: { brand: true } }),
    db.customer.count({ where }),
  ]);
  res.json({ customers, total, page, take, pages: Math.max(1, Math.ceil(total / take)) });
});

// Detail (full profile)
customersRouter.get("/:id", requirePerm("customer.read"), async (req, res) => {
  const user = req.user!;
  const c = await db.customer.findUnique({
    where: { id: req.params.id },
    include: {
      brand: true,
      consent: true,
      loyaltyAccount: { include: { redemptions: { orderBy: { createdAt: "desc" }, take: 5 } } },
      orders: { orderBy: { createdAt: "desc" }, take: 10 },
      events: { orderBy: { occurredAt: "desc" }, take: 20 },
      messages: { orderBy: { createdAt: "desc" }, take: 10 },
      segmentMembers: { include: { segment: true } },
      person: { include: { customers: { where: { NOT: { id: req.params.id } }, include: { brand: true } } } },
    },
  });
  if (!c || !canAccessBrand(user, c.brandId)) return res.status(404).json({ error: "Not found" });
  const [lifecyclePred, products] = await Promise.all([predictLifecycle(c.id), recommendProducts(c.id)]);
  res.json({ customer: c, ai: { lifecyclePred, products } });
});

const CreateSchema = z.object({
  brandId: z.string().cuid(),
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  source: z.string().optional(),
});

customersRouter.post("/", requirePerm("customer.create"), async (req, res) => {
  const user = req.user!;
  const parsed = CreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });
  if (!canAccessBrand(user, parsed.data.brandId)) return res.status(403).json({ error: "Forbidden" });
  const c = await db.customer.create({ data: { ...parsed.data, consent: { create: {} } } });
  await logAudit({ userId: user.id, action: "customer.create", entityType: "Customer", entityId: c.id });
  res.status(201).json({ customer: c });
});

customersRouter.patch("/:id", requirePerm("customer.update"), async (req, res) => {
  const user = req.user!;
  const c = await db.customer.findUnique({ where: { id: req.params.id } });
  if (!c || !canAccessBrand(user, c.brandId)) return res.status(404).json({ error: "Not found" });
  const updated = await db.customer.update({ where: { id: req.params.id }, data: req.body });
  await logAudit({ userId: user.id, action: "customer.update", entityType: "Customer", entityId: c.id, metadata: req.body });
  res.json({ customer: updated });
});
