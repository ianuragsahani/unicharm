import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "../db.js";
import { signToken } from "../middleware/auth.js";
import type { AuthUser, Role } from "../lib/rbac.js";

export const authRouter = Router();

const LoginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

authRouter.post("/login", async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });
  const { email, password } = parsed.data;

  const user = await db.user.findUnique({
    where: { email },
    include: { brandAccess: { include: { brand: true } } },
  });
  if (!user || !user.active) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
    brands: user.brandAccess.map((b) => ({ id: b.brand.id, slug: b.brand.slug, name: b.brand.name, color: b.brand.color })),
  };
  const token = signToken(authUser);
  res.json({ user: authUser, token });
});
