import { notFound } from "next/navigation";
import Link from "next/link";
import { serverApi } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LifecycleBadge, Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";
import { formatINR, formatNum, formatDate, relativeTime, parseJSON } from "@/lib/utils";
import { Mail, Phone, MapPin, Sparkles, MessageCircle } from "lucide-react";

export default async function CustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let data: { customer: any; ai: { lifecyclePred: any; products: any[] } };
  try {
    data = await serverApi(`/customers/${id}`);
  } catch {
    notFound();
  }
  const c = data!.customer;
  const lifecyclePred = data!.ai.lifecyclePred;
  const products = data!.ai.products;

  return (
    <div className="space-y-6">
      <PageHeader
        title={c.name}
        description={`${c.brand.name} · ${c.externalId ?? "—"}`}
        actions={
          <>
            <Button variant="outline" size="sm"><MessageCircle size={14} /> Message</Button>
            <Button size="sm">Edit profile</Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <FadeIn className="lg:col-span-1 space-y-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <Avatar name={c.name} size={56} />
                <div className="min-w-0">
                  <p className="text-base font-semibold truncate">{c.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <LifecycleBadge value={c.lifecycle} />
                    <Badge variant="outline">{c.source ?? "unknown"}</Badge>
                  </div>
                </div>
              </div>
              <dl className="mt-5 space-y-2.5 text-sm">
                <div className="flex items-center gap-2"><Mail size={13} className="text-muted" /><span className="text-zinc-700 truncate">{c.email ?? "—"}</span></div>
                <div className="flex items-center gap-2"><Phone size={13} className="text-muted" /><span className="text-zinc-700">{c.phone ?? "—"}</span></div>
                <div className="flex items-center gap-2"><MapPin size={13} className="text-muted" /><span className="text-zinc-700">{c.city ?? "—"}, {c.state ?? "—"}</span></div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Key metrics</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <Metric label="CLTV" value={formatINR(c.cltv)} />
              <Metric label="Orders" value={formatNum(c.totalOrders)} />
              <Metric label="Churn score" value={`${(c.churnScore * 100).toFixed(0)}%`} />
              <Metric label="Loyalty pts" value={formatNum(c.loyaltyAccount?.points ?? 0)} />
              <Metric label="Tier" value={c.loyaltyAccount?.tier ?? "—"} />
              <Metric label="Created" value={formatDate(c.createdAt)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Consent</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-sm">
                <ConsentRow label="Email" on={c.consent?.email} />
                <ConsentRow label="SMS" on={c.consent?.sms} />
                <ConsentRow label="WhatsApp" on={c.consent?.whatsapp} />
                <ConsentRow label="Push" on={c.consent?.push} />
              </ul>
            </CardContent>
          </Card>

          {c.person && c.person.customers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Same person, other brands</CardTitle>
                <p className="text-xs text-muted">Stitched by email/phone</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {c.person.customers.map((sib: any) => (
                    <li key={sib.id}>
                      <Link href={`/customers/${sib.id}`} className="flex items-center gap-2 rounded-lg border border-border p-2.5 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: sib.brand.color }} aria-hidden />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{sib.brand.name}</p>
                          <p className="text-xs text-muted">{sib.lifecycle} · {formatINR(sib.cltv)}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </FadeIn>

        <FadeIn delay={0.1} className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2"><Sparkles size={14} className="text-brand-600" />AI insights</CardTitle>
                <CardDescription>Heuristic predictions — swap with ML in prod</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Predicted next stage</p>
                <p className="mt-1 text-lg font-semibold">{lifecyclePred?.predicted}</p>
                <p className="mt-1 text-xs text-muted">{lifecyclePred?.daysSinceLastOrder != null ? `${lifecyclePred.daysSinceLastOrder}d since last order` : "No orders yet"}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Recommended products</p>
                <ul className="mt-1.5 space-y-1 text-sm">
                  {products.map((p) => (
                    <li key={p.name} className="flex items-center justify-between">
                      <span className="truncate">{p.name}</span>
                      <span className="text-xs font-medium text-brand-700">{(p.score * 100).toFixed(0)}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Order history</CardTitle>
                <CardDescription>Last 10 transactions</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {c.orders.length === 0 ? (
                <p className="text-sm text-muted">No orders yet.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {c.orders.map((o: any) => (
                    <li key={o.id} className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium">{formatINR(o.amount)}</p>
                        <p className="text-xs text-muted">{o.items} items · {o.channel}</p>
                      </div>
                      <p className="text-xs text-muted">{relativeTime(o.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Activity timeline</CardTitle>
                <CardDescription>Recent events across all channels</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ol className="relative ml-3 border-l border-border pl-5 space-y-3">
                {c.events.slice(0, 12).map((e: any) => (
                  <li key={e.id} className="relative">
                    <span className="absolute -left-[27px] top-1.5 h-2 w-2 rounded-full bg-brand-500" />
                    <p className="text-sm font-medium">{e.type.replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted">{relativeTime(e.occurredAt)}</p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</p>
    <p className="text-sm font-semibold">{value}</p>
  </div>
);

const ConsentRow = ({ label, on }: { label: string; on?: boolean }) => (
  <li className="flex items-center justify-between">
    <span className="text-zinc-700">{label}</span>
    <span className={`text-xs font-medium ${on ? "text-success" : "text-muted"}`}>{on ? "Opted in" : "Opted out"}</span>
  </li>
);
