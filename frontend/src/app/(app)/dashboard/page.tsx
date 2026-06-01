import { getSessionUser } from "@/lib/session";
import { serverApi } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { Stat } from "@/components/ui/stat";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LifecycleBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion/fade-in";
import { formatINR, formatNum, relativeTime } from "@/lib/utils";
import { Users, IndianRupee, TrendingUp, Activity } from "lucide-react";
import { LineKpi } from "@/components/charts/line-kpi";

export default async function Dashboard() {
  const user = await getSessionUser();
  const data = await serverApi<{
    totals: { totalCust: number; activeCust: number; vipCust: number; atRisk: number; msgCount: number };
    revenue: { total: number; avg: number };
    recentCust: any[];
    campaigns: any[];
  }>("/dashboard");

  const { totalCust, activeCust, vipCust, atRisk, msgCount } = data.totals;
  const recentCust = data.recentCust;
  const campaigns = data.campaigns;
  const totalRevenue = data.revenue.total;
  const avgCLTV = data.revenue.avg;

  const series = Array.from({ length: 14 }, (_, i) => ({
    label: `D${i + 1}`,
    value: Math.round(totalRevenue / 14 * (0.6 + Math.random() * 0.8)),
  }));

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome back, ${user.name.split(" ")[0]}`} description="Real-time intelligence across all your brands." />

      <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StaggerItem><Stat label="Total customers" value={formatNum(totalCust)} delta={{ value: 12.4 }} icon={<Users size={16} />} /></StaggerItem>
        <StaggerItem><Stat label="Total CLTV" value={formatINR(totalRevenue)} delta={{ value: 8.1 }} icon={<IndianRupee size={16} />} /></StaggerItem>
        <StaggerItem><Stat label="VIP customers" value={formatNum(vipCust)} delta={{ value: 3.2 }} icon={<TrendingUp size={16} />} /></StaggerItem>
        <StaggerItem><Stat label="Messages sent" value={formatNum(msgCount)} delta={{ value: -2.1 }} icon={<Activity size={16} />} /></StaggerItem>
      </Stagger>

      <div className="grid gap-4 lg:grid-cols-3">
        <FadeIn delay={0.1} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Revenue trend</CardTitle>
                <CardDescription>Last 14 days · all brands</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <LineKpi data={series} />
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.15}>
          <Card>
            <CardHeader><CardTitle>Lifecycle mix</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <LifecycleRow label="Active" value={activeCust} total={totalCust} color="bg-success" />
              <LifecycleRow label="VIP" value={vipCust} total={totalCust} color="bg-brand-600" />
              <LifecycleRow label="At-risk" value={atRisk} total={totalCust} color="bg-warning" />
              <LifecycleRow label="Avg CLTV" value={Math.round(avgCLTV)} total={Math.round(avgCLTV * 1.5)} color="bg-zinc-400" hint format="inr" />
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <FadeIn delay={0.2}>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Recent customers</CardTitle>
                <CardDescription>Newly created profiles</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {recentCust.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 py-2.5">
                    <Avatar name={c.name} size={32} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.name}</p>
                      <p className="truncate text-xs text-muted">{c.email}</p>
                    </div>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: `${c.brand.color}1a`, color: c.brand.color }}>{c.brand.name}</span>
                    <LifecycleBadge value={c.lifecycle} />
                    <span className="hidden text-xs text-muted sm:inline">{relativeTime(c.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.25}>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Active campaigns</CardTitle>
                <CardDescription>By recency</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {campaigns.map((c) => {
                  const ctr = c.sent ? c.clicked / c.sent : 0;
                  return (
                    <li key={c.id} className="flex items-center gap-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{c.name}</p>
                        <p className="truncate text-xs text-muted">{c.channel} · {c.brand.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold">{(ctr * 100).toFixed(1)}% CTR</p>
                        <p className="text-[10px] text-muted">{formatNum(c.sent)} sent</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}

function LifecycleRow({ label, value, total, color, hint, format }: { label: string; value: number; total: number; color: string; hint?: boolean; format?: "inr" }) {
  const pct = total ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-zinc-700">{label}</span>
        <span className="font-medium">{format === "inr" ? formatINR(value) : formatNum(value)}{!hint && total > 0 && <span className="text-muted"> · {pct.toFixed(0)}%</span>}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
        <div className={`${color} h-full rounded-full transition-all`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}
