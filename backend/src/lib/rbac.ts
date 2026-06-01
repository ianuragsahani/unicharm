export type Role = "SUPER_ADMIN" | "BRAND_ADMIN" | "MARKETER" | "ANALYST" | "AGENT";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  brands: { id: string; slug: string; name: string; color: string }[];
};

const PERMS: Record<Role, string[]> = {
  SUPER_ADMIN: ["*"],
  BRAND_ADMIN: ["customer.*", "segment.*", "campaign.*", "journey.*", "whatsapp.*", "loyalty.*", "analytics.read", "ai.read", "user.read"],
  MARKETER: ["customer.read", "segment.*", "campaign.*", "journey.*", "whatsapp.send", "analytics.read", "ai.read"],
  ANALYST: ["customer.read", "segment.read", "campaign.read", "journey.read", "analytics.read", "ai.read", "user.read"],
  AGENT: ["customer.read", "whatsapp.*", "message.*"],
};

export function can(role: Role, perm: string): boolean {
  const grants = PERMS[role] ?? [];
  if (grants.includes("*")) return true;
  if (grants.includes(perm)) return true;
  const [scope] = perm.split(".");
  return grants.includes(`${scope}.*`);
}

export function canAccessBrand(user: AuthUser, brandId: string): boolean {
  if (user.role === "SUPER_ADMIN") return true;
  return user.brands.some((b) => b.id === brandId);
}

export function brandIdsFor(user: AuthUser): string[] {
  return user.brands.map((b) => b.id);
}

/** Resolve effective brand filter respecting the X-Active-Brand header. */
export function activeBrandIds(user: AuthUser, activeBrand?: string): string[] {
  const all = brandIdsFor(user);
  if (!activeBrand || activeBrand === "ALL") return all;
  return all.includes(activeBrand) ? [activeBrand] : all;
}
