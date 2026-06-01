"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type Brand = { id: string; name: string; color: string };

export function AddCustomerButton({ brands }: { brands: Brand[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    brandId: brands[0]?.id ?? "",
    name: "",
    email: "",
    phone: "",
    city: "",
    source: "website",
  });

  function update<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    start(async () => {
      const payload: Record<string, string> = { brandId: form.brandId, name: form.name, source: form.source };
      if (form.email.trim()) payload.email = form.email.trim();
      if (form.phone.trim()) payload.phone = form.phone.trim();
      if (form.city.trim()) payload.city = form.city.trim();

      const r = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const text = await r.text();
        setErr(text || `Failed (${r.status})`);
        return;
      }
      setOpen(false);
      setForm({ brandId: brands[0]?.id ?? "", name: "", email: "", phone: "", city: "", source: "website" });
      toast({ variant: "success", title: "Customer created", description: `${form.name} added to CDP` });
      router.refresh();
    });
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}><Plus size={14} /> Add customer</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Add customer" description="Create a new customer profile in the CDP">
        <form onSubmit={submit} className="flex flex-1 min-h-0 flex-col">
          <DialogBody className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="add-brand">Brand *</Label>
                <select
                  id="add-brand"
                  required
                  value={form.brandId}
                  onChange={(e) => update("brandId", e.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                >
                  {brands.length === 0 && <option value="">No brands</option>}
                  {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="add-source">Source</Label>
                <select
                  id="add-source"
                  value={form.source}
                  onChange={(e) => update("source", e.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                >
                  <option value="website">Website</option>
                  <option value="app">Mobile app</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-name">Name *</Label>
              <Input id="add-name" required value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Full name" autoComplete="name" />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="add-email">Email</Label>
                <Input id="add-email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="name@example.com" autoComplete="email" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="add-phone">Phone</Label>
                <Input id="add-phone" type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+919876543210" autoComplete="tel" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-city">City</Label>
              <Input id="add-city" value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Mumbai" autoComplete="address-level2" />
            </div>

            {err && <p role="alert" className="text-xs text-danger">{err}</p>}
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={pending || !form.name || !form.brandId}>
              {pending ? "Saving…" : "Create customer"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  );
}
