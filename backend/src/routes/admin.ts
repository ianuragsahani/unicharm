import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "../db.js";
import { requirePerm } from "../middleware/auth.js";
import { activeBrandIds, canAccessBrand } from "../lib/rbac.js";
import { logAudit } from "../services/audit.js";

export const adminRouter = Router();

adminRouter.get("/users", requirePerm("user.read"), async (_req, res) => {
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { brandAccess: { include: { brand: true } } },
  });
  res.json({ users });
});

const InviteSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["SUPER_ADMIN", "BRAND_ADMIN", "MARKETER", "ANALYST", "AGENT"]),
  brandIds: z.array(z.string().cuid()).default([]),
  password: z.string().min(6).optional(),
});

adminRouter.post("/users", requirePerm("user.create"), async (req, res) => {
  const user = req.user!;
  const parsed = InviteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });
  const { name, email, role, brandIds, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "A user with that email already exists" });

  // Non-super admins can only grant brands they themselves can access.
  if (user.role !== "SUPER_ADMIN" && !brandIds.every((id) => canAccessBrand(user, id))) {
    return res.status(403).json({ error: "Cannot grant a brand you don't have access to" });
  }

  // Demo: invite creates an active account with a temporary password.
  const temp = password ?? "changeme123";
  const created = await db.user.create({
    data: {
      name, email, role,
      passwordHash: await bcrypt.hash(temp, 10),
      brandAccess: { create: brandIds.map((brandId) => ({ brandId })) },
    },
    include: { brandAccess: { include: { brand: true } } },
  });
  await logAudit({ userId: user.id, action: "user.create", entityType: "User", entityId: created.id, metadata: { role } });
  res.status(201).json({ user: created, tempPassword: password ? undefined : temp });
});

adminRouter.get("/brands", requirePerm("user.read"), async (_req, res) => {
  const brands = await db.brand.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { customers: true, segments: true, campaigns: true, journeys: true, templates: true } } },
  });
  res.json({ brands });
});

adminRouter.get("/audit", requirePerm("user.read"), async (_req, res) => {
  const logs = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { user: true } });
  res.json({ logs });
});

adminRouter.get("/consent", requirePerm("user.read"), async (req, res) => {
  const brandIds = activeBrandIds(req.user!, req.activeBrand);
  const [total, email, sms, whatsapp, push] = await Promise.all([
    db.consent.count({ where: { customer: { brandId: { in: brandIds } } } }),
    db.consent.count({ where: { email: true, customer: { brandId: { in: brandIds } } } }),
    db.consent.count({ where: { sms: true, customer: { brandId: { in: brandIds } } } }),
    db.consent.count({ where: { whatsapp: true, customer: { brandId: { in: brandIds } } } }),
    db.consent.count({ where: { push: true, customer: { brandId: { in: brandIds } } } }),
  ]);
  res.json({ total, email, sms, whatsapp, push });
});
