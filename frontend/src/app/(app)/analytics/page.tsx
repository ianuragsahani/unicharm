import { serverApi } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Stagger, StaggerItem, FadeIn } from "@/components/motion/fade-in";
import { Stat } from "@/components/ui/stat";
import { FunnelChart } from "@/components/charts/funnel";
import { CohortGrid } from "@/components/charts/cohort";
import { ChannelBars } from "@/components/charts/channel-bars";
import { AttributionPie } from "@/components/charts/attribution-pie";
import { formatINR, formatNum, formatPct } from "@/lib/utils";
import { Users, IndianRupee, TrendingUp, Activity } from "lucide-react";

export default async function AnalyticsPage() {
  const data = await serverApi<{
    funnel: { pageViews: number; addsToCart: number; purchases: number };
    totalCustomers: number;
    revenue: { sum: number; avg: number };
    eventsByType: { type: string; _count: number }[];
    brandRevenue: { brandId: string; _sum: { cltv: number | null } }[];
    brands: { id: string; name: string; color: string }[];
  }>("/analytics");

  const totalCustomers = data.totalCustomers;
  const revenue = data.revenue;
  const eventsByType = data.eventsByType;
  const brandRevenue = data.brandRevenue;
  const brands = data.brands;
  const brandMap = Object.fromEntries(brands.map((b) => [b.id, b]));

  const funnel = [
    { label: "Page view", value: data.funnel.pageViews, color: "hsl(259 88% 58%)" },
    { label: "Add to cart", value: data.funnel.addsToCart, color: "hsl(259 88% 65%)" },
    { label: "Purchase", value: data.funnel.purchases, color: "hsl(142 76% 41%)" },
  ];

  const cohorts = Array.from({ length: 6 }, (_, m) => ({
    cohort: `Month ${m + 1}`,
    retention: Array.from({ length: 6 }, (_, w) => Math.max(0.05, 0.92 - w * 0.13 - m * 0.02 - Math.random() * 0.05)),
  }));

  const channelData = [
    { channel: "WhatsApp", sent: 4820, ctr: 0.34, conv: 0.078 },
    { channel: "Email", sent: 12430, ctr: 0.21, conv: 0.034 },
    { channel: "SMS", sent: 2110, ctr: 0.12, conv: 0.022 },
    { channel: "Push", sent: 8240, ctr: 0.15, conv: 0.041 },
  ];

  const attribution = brandRevenue.map((b) => ({
    name: brandMap[b.brandId]?.name ?? "—",
    value: Math.round((b._sum.cltv ?? 0)),
    color: brandMap[b.brandId]?.color ?? "#888",
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Funnel · Cohort · CLTV · Attribution · Engagement" />

      <Stagger className="grid gap-4 md:grid-cols-4">
        <StaggerItem><Stat label="Total customers" value={formatNum(totalCustomers)} icon={<Users size={16} />} delta={{ value: 12.4 }} /></StaggerItem>
        <StaggerItem><Stat label="Revenue (orders)" value={formatINR(revenue.sum ?? 0)} icon={<IndianRupee size={16} />} delta={{ value: 9.8 }} /></StaggerItem>
        <StaggerItem><Stat label="Avg order value" value={formatINR(revenue.avg ?? 0)} icon={<TrendingUp size={16} />} delta={{ value: 2.3 }} /></StaggerItem>
        <StaggerItem><Stat label="Total events" value={formatNum(eventsByType.reduce((a, x) => a + x._count, 0))} icon={<Activity size={16} />} delta={{ value: 6.1 }} /></StaggerItem>
      </Stagger>

      <div className="grid gap-4 lg:grid-cols-2">
        <FadeIn>
          <Card>
            <CardHeader><div><CardTitle>Conversion funnel</CardTitle><CardDescription>View → Cart → Purchase</CardDescription></div></CardHeader>
            <CardContent><FunnelChart data={funnel} /></CardContent>
          </Card>
        </FadeIn>
        <FadeIn delay={0.1}>
          <Card>
            <CardHeader><div><CardTitle>Channel performance</CardTitle><CardDescription>CTR + conversion by channel</CardDescription></div></CardHeader>
            <CardContent><ChannelBars data={channelData} /></CardContent>
          </Card>
        </FadeIn>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <FadeIn className="lg:col-span-2">
          <Card>
            <CardHeader><div><CardTitle>Retention cohort</CardTitle><CardDescription>% of cohort active each week</CardDescription></div></CardHeader>
            <CardContent><CohortGrid cohorts={cohorts} /></CardContent>
          </Card>
        </FadeIn>
        <FadeIn delay={0.1}>
          <Card>
            <CardHeader><div><CardTitle>Revenue attribution</CardTitle><CardDescription>By brand</CardDescription></div></CardHeader>
            <CardContent><AttributionPie data={attribution} /></CardContent>
          </Card>
        </FadeIn>
      </div>

      <Card>
        <CardHeader><CardTitle>Engagement by event type</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-4 md:grid-cols-7">
            {eventsByType.map((e) => (
              <div key={e.type} className="rounded-lg border border-border p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted">{e.type.replace(/_/g, " ")}</p>
                <p className="mt-1 text-lg font-semibold">{formatNum(e._count)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
