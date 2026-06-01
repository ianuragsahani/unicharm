"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { NAV } from "./nav-items";

export function Sidebar() {
  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border bg-surface" aria-label="Primary navigation">
      <div className="flex h-14 items-center gap-2 px-5 border-b border-border">
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-brand-600 text-white text-xs font-bold">U</div>
        <span className="text-sm font-semibold">Unicharm CRM</span>
      </div>
      <NavList />
      <div className="border-t border-border p-3 text-[10px] text-muted">v0.1 · MVP build</div>
    </aside>
  );
}

export function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const p = usePathname();
  return (
    <nav className="flex-1 overflow-y-auto scrollbar-thin p-3 text-sm">
      {NAV.map((item, i) =>
        "section" in item ? (
          <p key={i} className="mt-4 mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted">{item.section}</p>
        ) : (
          (() => {
            const active = p === item.href || p?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={onNavigate}
                className={cn(
                  "relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 font-medium text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1",
                  active && "text-brand-700 bg-brand-50",
                )}
              >
                {active && (
                  <motion.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-lg bg-brand-50" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                )}
                <item.icon size={16} />
                {item.label}
              </Link>
            );
          })()
        ),
      )}
    </nav>
  );
}
