"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type Brand = { id: string; name: string; color: string };
const ROLES = ["SUPER_ADMIN", "BRAND_ADMIN", "MARKETER", "ANALYST", "AGENT"] as const;

export function InviteUserButton({ brands }: { brands: Brand[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]>("MARKETER");
  const [brandIds, setBrandIds] = useState<Set<string>>(new Set());

  function toggleBrand(id: string) {
    setBrandIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function reset() {
    setName(""); setEmail(""); setRole("MARKETER"); setBrandIds(new Set()); setErr(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    start(async () => {
      const r = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role, brandIds: [...brandIds] }),
      });
      if (!r.ok) {
        const text = await r.text();
        setErr(text || `Failed (${r.status})`);
        return;
      }
      const data = await r.json();
      setOpen(false);
      reset();
      toast({
        variant: "success",
        title: "User invited",
        description: data.tempPassword ? `${name} added · temp password: ${data.tempPassword}` : `${name} added`,
      });
      router.refresh();
    });
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}><Plus size={14} /> Invite user</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Invite user" description="Create an account and grant brand access">
        <form onSubmit={submit} className="flex flex-1 min-h-0 flex-col">
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="inv-name">Name *</Label>
              <Input id="inv-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" autoComplete="name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-email">Email *</Label>
              <Input id="inv-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@unicharm.in" autoComplete="email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-role">Role *</Label>
              <select
                id="inv-role"
                value={role}
                onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}
                className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              >
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Brand access</Label>
              <div className="flex flex-wrap gap-2">
                {brands.map((b) => {
                  const on = brandIds.has(b.id);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => toggleBrand(b.id)}
                      aria-pressed={on}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${on ? "border-transparent text-white" : "border-border text-muted hover:bg-zinc-50"}`}
                      style={on ? { background: b.color } : undefined}
                    >
                      {b.name}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted">SUPER_ADMIN sees all brands regardless of selection.</p>
            </div>
            {err && <p role="alert" className="text-xs text-danger">{err}</p>}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={pending || !name || !email}>
              {pending ? "Inviting…" : "Invite user"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  );
}
