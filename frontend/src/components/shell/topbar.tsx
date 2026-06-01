"use client";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, LogOut, Search } from "lucide-react";
import { BrandSwitcher } from "./brand-switcher";
import { MobileDrawer } from "./mobile-drawer";
import { Avatar } from "@/components/ui/avatar";

export function Topbar() {
  const { data } = useSession();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [bell, setBell] = useState(false);
  const [q, setQ] = useState("");
  const u = data?.user;

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    router.push(`/customers?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 sm:gap-3 border-b border-border bg-surface/80 px-3 sm:px-5 backdrop-blur">
      <MobileDrawer />

      <form onSubmit={submitSearch} className="relative max-w-md flex-1 sm:flex-none sm:w-80" role="search">
        <label htmlFor="topbar-search" className="sr-only">Search customers</label>
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
        <input
          id="topbar-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search customers by name, email, phone…"
          className="h-9 w-full rounded-lg border border-border bg-bg pl-8 pr-3 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </form>

      {/* Right cluster: brand switcher, notifications, user menu pinned right */}
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
      <BrandSwitcher />

      <div className="relative">
        <button
          onClick={() => { setBell((v) => !v); setMenu(false); }}
          aria-label="View notifications"
          aria-expanded={bell}
          className="grid h-9 w-9 place-items-center rounded-lg text-zinc-600 hover:bg-zinc-100"
        >
          <Bell size={16} />
        </button>
        <AnimatePresence>
          {bell && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setBell(false)} />
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 z-40 mt-1.5 w-80 overflow-hidden rounded-xl border border-border bg-surface shadow-pop"
              >
                <div className="border-b border-border p-3">
                  <p className="text-sm font-semibold">Notifications</p>
                </div>
                <ul className="max-h-64 divide-y divide-border overflow-y-auto">
                  <li className="p-3">
                    <p className="text-xs font-medium">Welcome to Unicharm CRM</p>
                    <p className="mt-0.5 text-[11px] text-muted">Demo build. Real events will surface here.</p>
                  </li>
                </ul>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <div className="relative">
        <button
          onClick={() => { setMenu((v) => !v); setBell(false); }}
          aria-label="Open user menu"
          aria-expanded={menu}
          className="flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-zinc-100"
        >
          <Avatar name={u?.name ?? "U"} size={30} />
          <div className="hidden text-left text-xs sm:block">
            <p className="font-medium">{u?.name}</p>
            <p className="text-muted">{(u as any)?.role}</p>
          </div>
        </button>
        <AnimatePresence>
          {menu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenu(false)} />
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 z-40 mt-1.5 w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-pop"
              >
                <div className="border-b border-border p-3">
                  <p className="text-sm font-medium">{u?.name}</p>
                  <p className="text-xs text-muted">{u?.email}</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/5"
                >
                  <LogOut size={14} /> Sign out
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
      </div>
    </header>
  );
}
