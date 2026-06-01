import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { AuthUser, Role } from "../lib/rbac.js";
import { can } from "../lib/rbac.js";

const SECRET = process.env.JWT_SECRET ?? "dev-secret";

declare global {
  // eslint-disable-next-line no-var
  namespace Express {
    interface Request {
      user?: AuthUser;
      activeBrand?: string;
    }
  }
}

export function signToken(user: AuthUser): string {
  return jwt.sign(
    { uid: user.id, email: user.email, name: user.name, role: user.role, brands: user.brands },
    SECRET,
    { expiresIn: "8h" },
  );
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, SECRET) as any;
    req.user = {
      id: payload.uid,
      email: payload.email,
      name: payload.name,
      role: payload.role as Role,
      brands: payload.brands ?? [],
    };
    req.activeBrand = (req.headers["x-active-brand"] as string) || undefined;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export function requirePerm(perm: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (!can(req.user.role, perm)) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}
