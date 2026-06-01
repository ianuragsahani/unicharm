import Link from "next/link";
import { serverApi } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Stat } from "@/components/ui/stat";
import { Badge } from "@/components/ui/badge";
import { Stagger, StaggerItem, FadeIn } from "@/components/motion/fade-in";
import { Award, Crown, Trophy, Star } from "lucide-react";
import { formatINR, formatNum, parseJSON } from "@/lib/utils";

const TIER_ICON: Record<string, any> = { Platinum: Crown, Gold: Trophy, Silver: Award, Bronze: Star };
const TIER_COLOR: Record<string, string> = { Platinum: "from-zinc-700 to-zinc-900", Gold: "from-amber-400 to-amber-600", Silver: "from-zinc-300 to-zinc-500", Bronze: "from-orange-700 to-orange-900" };

export default async function LoyaltyPage() {
  const data = await serverApi<{
    tierCounts: { tier: string; _count: number }[];
    totalPoints: { _sum: { points: number | null; totalEarned: number | null } };
    totalRedeemed: { _sum: { totalRedeemed: number | null } };
    topMembers: any[];
    tiers: any[];
  }>("/loyalty");
  const { tierCounts, totalPoints, totalRedeemed, topMembers, tiers } = data;

  const tierMap = Object.fromEntries(tierCounts.map((t) => [t.tier, t._count]));
  const total = tierCounts.reduce((a, t) => a + t._count, 0);

  // Group tiers by brand for display
  const tiersByBrand: Record<string, any[]> = {};
  for (const t of tiers) {
    const k = t.brand.name;
    tiersByBrand[k] = tiersByBrand[k] ?? [];
    tiersByBrand[k].push(t);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Loyalty & Rewards" description="Tiers, points, redemptions across brands" />

      <Stagger className="grid gap-4 md:grid-cols-4">
        <StaggerItem><Stat label="Active members" value={formatNum(total)} delta={{ value: 8.4 }} icon={<Award size={16} />} /></StaggerItem>
        <StaggerItem><Stat label="Points outstanding" value={formatNum(totalPoints._sum.points ?? 0)} delta={{ value: 3.1 }} icon={<Star size={16} />} /></StaggerItem>
        <StaggerItem><Stat label="Lifetime earned" value={formatNum(totalPoints._sum.totalEarned ?? 0)} delta={{ value: 12.4 }} icon={<Trophy size={16} />} /></StaggerItem>
        <StaggerItem><Stat label="Lifetime redeemed" value={formatNum(totalRedeemed._sum.totalRedeemed ?? 0)} delta={{ value: 5.2 }} icon={<Crown size={16} />} /></StaggerItem>
      </Stagger>

      <FadeIn>
        <Card>
          <CardHeader><CardTitle>Tier distribution</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              {["Platinum", "Gold", "Silver", "Bronze"].map((t) => {
                const c = tierMap[t] ?? 0;
                const pct = total ? (c / total) * 100 : 0;
                const Icon = TIER_ICON[t];
                return (
                  <div key={t} className="rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between">
                      <div className={`grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br ${TIER_COLOR[t]} text-white`}>
                        <Icon size={16} />
                      </div>
                      <span className="text-xs font-semibold text-muted">{pct.toFixed(0)}%</span>
                    </div>
                    <p className="mt-3 text-sm font-semibold">{t}</p>
                    <p className="mt-0.5 text-xs text-muted">{formatNum(c)} members</p>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-zinc-100">
                      <div className={`h-full bg-gradient-to-r ${TIER_COLOR[t]}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      <div className="grid gap-4 lg:grid-cols-3">
        <FadeIn className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Top members</CardTitle></CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {topMembers.map((m, i) => (
                  <li key={m.id} className="flex items-center gap-3 py-2.5">
                    <span className="w-5 text-center text-xs font-semibold text-muted">{i + 1}</span>
                    <Avatar name={m.customer.name} size={32} />
                    <div className="min-w-0 flex-1">
                      <Link href={`/customers/${m.customer.id}`} className="text-sm font-medium hover:text-brand-700">{m.customer.name}</Link>
                      <p className="text-xs text-muted">{m.customer.brand.name} · CLTV {formatINR(m.customer.cltv)}</p>
                    </div>
                    <Badge variant="info">{m.tier}</Badge>
                    <p className="w-24 text-right text-sm font-semibold tabular-nums">{formatNum(m.points)} pts</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.1}>
          <Card>
            <CardHeader><CardTitle>Tier perks</CardTitle><CardDescription>By brand</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(tiersByBrand).map(([brand, list]) => (
                <div key={brand}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">{brand}</p>
                  <ul className="mt-2 space-y-1.5">
                    {list.map((t) => (
                      <li key={t.id} className="rounded-lg border border-border p-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{t.name}</span>
                          <span className="text-muted">{t.minPoints}+ pts</span>
                        </div>
                        <p className="mt-1 text-zinc-700">{parseJSON<string[]>(t.perks, []).join(" · ")}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
