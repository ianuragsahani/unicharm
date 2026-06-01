import { serverApi } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { Stagger, StaggerItem, FadeIn } from "@/components/motion/fade-in";
import { Mail, MessageCircle, Smartphone, Bell, ShieldCheck } from "lucide-react";
import { formatNum, formatPct } from "@/lib/utils";

export default async function ConsentPage() {
  const { total, email, sms, whatsapp, push } = await serverApi<{ total: number; email: number; sms: number; whatsapp: number; push: number }>("/admin/consent");

  return (
    <div className="space-y-6">
      <PageHeader title="Consent governance" description="DPDP-aligned communication preferences" />

      <Stagger className="grid gap-4 md:grid-cols-4">
        <StaggerItem><Stat label="Email opt-in" value={formatPct(email / Math.max(1, total))} icon={<Mail size={16} />} /></StaggerItem>
        <StaggerItem><Stat label="WhatsApp opt-in" value={formatPct(whatsapp / Math.max(1, total))} icon={<MessageCircle size={16} />} /></StaggerItem>
        <StaggerItem><Stat label="SMS opt-in" value={formatPct(sms / Math.max(1, total))} icon={<Smartphone size={16} />} /></StaggerItem>
        <StaggerItem><Stat label="Push opt-in" value={formatPct(push / Math.max(1, total))} icon={<Bell size={16} />} /></StaggerItem>
      </Stagger>

      <FadeIn>
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2"><ShieldCheck size={14} className="text-success" /> Compliance posture</CardTitle>
              <CardDescription>Static checks against PRD §9</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <CheckRow label="AES-256 encryption at rest" status="planned" note="Provision via RDS/EBS encryption" />
              <CheckRow label="Role-based access control" status="active" note="RBAC enforced in middleware + API handlers" />
              <CheckRow label="Audit log immutability" status="active" note="Append-only audit table" />
              <CheckRow label="GDPR / DPDP — right to erasure" status="planned" note="Wire /api/customers/[id] DELETE with consent cascade" />
              <CheckRow label="Consent capture & versioning" status="active" note="Consent table tracks per-channel opt-in" />
            </ul>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card>
          <CardHeader><CardTitle>Opt-in distribution</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { ch: "Email", value: email, color: "bg-brand-600" },
              { ch: "WhatsApp", value: whatsapp, color: "bg-success" },
              { ch: "SMS", value: sms, color: "bg-warning" },
              { ch: "Push", value: push, color: "bg-cyan-500" },
            ].map((r) => {
              const pct = total ? (r.value / total) * 100 : 0;
              return (
                <div key={r.ch}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span>{r.ch}</span>
                    <span className="tabular-nums">{formatNum(r.value)} / {formatNum(total)} · {pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                    <div className={`${r.color} h-full rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}

function CheckRow({ label, status, note }: { label: string; status: "active" | "planned"; note: string }) {
  return (
    <li className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-xs text-muted">{note}</p>
      </div>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${status === "active" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{status === "active" ? "Active" : "Planned"}</span>
    </li>
  );
}
