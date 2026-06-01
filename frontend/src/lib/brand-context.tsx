"use client";
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

export type Brand = { id: string; slug: string; name: string; color: string };

type Ctx = {
  brands: Brand[];
  active: Brand | "ALL";
  setActive: (b: Brand | "ALL") => void;
};

const BrandCtx = createContext<Ctx | null>(null);

function setCookie(name: string, value: string, days = 30) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 86400000).toUTCString();
  document.cookie = `${name}=${value};expires=${expires};path=/;SameSite=Lax`;
}

export function BrandProvider({ brands, initialActiveId, children }: { brands: Brand[]; initialActiveId?: string | null; children: ReactNode }) {
  const router = useRouter();
  const initial: Brand | "ALL" = (() => {
    if (!initialActiveId || initialActiveId === "ALL") return "ALL";
    return brands.find((b) => b.id === initialActiveId) ?? "ALL";
  })();
  const [active, setActiveState] = useState<Brand | "ALL">(initial);

  useEffect(() => {
    // Keep cookie in sync if missing
    setCookie("active-brand", active === "ALL" ? "ALL" : active.id);
  }, []);

  const setActive = (b: Brand | "ALL") => {
    setActiveState(b);
    setCookie("active-brand", b === "ALL" ? "ALL" : b.id);
    router.refresh();
  };

  return <BrandCtx.Provider value={{ brands, active, setActive }}>{children}</BrandCtx.Provider>;
}

export const useBrand = () => {
  const c = useContext(BrandCtx);
  if (!c) throw new Error("useBrand outside BrandProvider");
  return c;
};
