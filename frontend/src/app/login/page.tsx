"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("admin@unicharm.in");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    const r = await signIn("credentials", { redirect: false, email, password });
    setLoading(false);
    if (r?.error) setErr("Invalid email or password");
    else router.push(params.get("callbackUrl") ?? "/dashboard");
  }

  const demos = [
    { e: "admin@unicharm.in", p: "admin123", label: "Super Admin (all brands)" },
    { e: "sofy.manager@unicharm.in", p: "sofy123", label: "Brand Admin (Sofy only)" },
    { e: "analyst@unicharm.in", p: "analyst123", label: "Analyst (read-only)" },
  ];

  return (
    <main className="grid min-h-screen lg:grid-cols-2 gradient-mesh">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center justify-center p-8"
      >
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white font-bold">U</div>
            <div>
              <p className="text-sm font-semibold">Unicharm CRM</p>
              <p className="text-xs text-muted">Unified Customer Intelligence</p>
            </div>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-muted">Use a demo account below or your credentials.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            </div>
            {err && <p className="text-xs text-danger">{err}</p>}
            <Button type="submit" disabled={loading} className="w-full">{loading ? "Signing in…" : "Sign in"}</Button>
          </form>

          <div className="mt-6 rounded-xl border border-dashed border-border p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Demo accounts</p>
            <div className="mt-2 space-y-1">
              {demos.map((d) => (
                <button
                  key={d.e}
                  type="button"
                  onClick={() => { setEmail(d.e); setPassword(d.p); }}
                  className="block w-full rounded-md px-2 py-1 text-left text-xs hover:bg-zinc-50"
                >
                  <span className="font-medium">{d.label}</span>
                  <span className="block text-muted">{d.e} / {d.p}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="hidden lg:flex items-center justify-center bg-gradient-to-br from-brand-600 to-brand-800 p-12 text-white"
      >
        <div className="max-w-md">
          <p className="text-sm font-medium opacity-80">Unicharm India</p>
          <h2 className="mt-2 text-4xl font-semibold tracking-tight">One profile. Every brand. Real-time.</h2>
          <p className="mt-4 text-sm opacity-90">CDP, segmentation, journeys, WhatsApp, analytics, AI, loyalty, and governance — across Sofy, Mamy Poko Pants, Lifree, and Pet Care.</p>
          <div className="mt-8 grid grid-cols-2 gap-3 text-xs">
            {["Sofy", "Mamy Poko Pants", "Lifree", "Pet Care"].map((b) => (
              <div key={b} className="rounded-lg bg-white/10 px-3 py-2 backdrop-blur">{b}</div>
            ))}
          </div>
        </div>
      </motion.section>
    </main>
  );
}
