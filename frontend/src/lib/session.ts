import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { authOptions } from "./auth";

export type Brand = { id: string; slug: string; name: string; color: string };
export type Role = "SUPER_ADMIN" | "BRAND_ADMIN" | "MARKETER" | "ANALYST" | "AGENT";
export type SessionUser = { id: string; email: string; name: string; role: Role; brands: Brand[] };

export async function getSessionUser(): Promise<SessionUser> {
  const s = await getServerSession(authOptions);
  return s!.user as unknown as SessionUser;
}

export async function activeBrandSelection(user: SessionUser): Promise<string | "ALL"> {
  const c = await cookies();
  const v = c.get("active-brand")?.value;
  if (!v || v === "ALL") return "ALL";
  return user.brands.some((b) => b.id === v) ? v : "ALL";
}

export function canRole(role: Role, perm: string): boolean {
  const PERMS: Record<Role, string[]> = {
    SUPER_ADMIN: ["*"],
    BRAND_ADMIN: ["customer.*", "segment.*", "campaign.*", "journey.*", "whatsapp.*", "loyalty.*", "analytics.read", "ai.read", "user.read"],
    MARKETER: ["customer.read", "segment.*", "campaign.*", "journey.*", "whatsapp.send", "analytics.read", "ai.read"],
    ANALYST: ["customer.read", "segment.read", "campaign.read", "journey.read", "analytics.read", "ai.read", "user.read"],
    AGENT: ["customer.read", "whatsapp.*", "message.*"],
  };
  const grants = PERMS[role] ?? [];
  if (grants.includes("*") || grants.includes(perm)) return true;
  return grants.includes(`${perm.split(".")[0]}.*`);
}
