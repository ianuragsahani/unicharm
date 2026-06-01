import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { authOptions } from "./auth";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

/**
 * Server-side fetch to the backend API. Injects the NextAuth-issued JWT and
 * the active-brand cookie. Use inside server components / server actions.
 */
export async function serverApi<T = any>(path: string, init?: RequestInit): Promise<T> {
  const session = await getServerSession(authOptions);
  const token = (session as any)?.backendToken as string | undefined;
  const c = await cookies();
  const activeBrand = c.get("active-brand")?.value ?? "ALL";

  const r = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "X-Active-Brand": activeBrand,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`API ${path} failed: ${r.status} ${text}`);
  }
  return r.json() as Promise<T>;
}
