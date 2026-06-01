import { serverApi } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { Stagger, StaggerItem, FadeIn } from "@/components/motion/fade-in";
import { Avatar } from "@/components/ui/avatar";
import { formatINR, formatNum } from "@/lib/utils";
import { Users, Network, ShoppingBag, ArrowRight } from "lucide-react";
import { AddToCampaignButton } from "./add-to-campaign-button";

type Matrix = { brand: { id: string; slug: string; name: string; color: string }; row: number[] }[];

export default async function CrossSellPage() {
  const data = await serverApi<{
    totalPersons: number;
    multiBrandPersons: number;
    multiBrandCLTV: number;
    opps: any[];
    brands: { id: string; slug: string; name: string; color: string }[];
    matrix: Matrix;
  }>("/cross-sell");

  const totalPersons = data.totalPersons;
  const multiBrandPersons = data.multiBrandPersons;
  const opps = data.opps;
  const brands = data.brands;
  const multiBrandCLTV = { _sum: { totalCLTV: data.multiBrandCLTV } };
  const matrix = data.matrix;

  const brandColors = Object.fromEntries(brands.map((b) => [b.slug, b.color]));
  const penetration = totalPersons ? multiBrandPersons / totalPersons : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Cross-brand & cross-sell" description="Unified persons across Unicharm ecosystem · cross-sell opportunities" />

      <Stagger className="grid gap-4 md:grid-cols-4">
        <StaggerItem><Stat label="Unique persons" value={formatNum(totalPersons)} icon={<Users size={16} />} delta={{ value: 4.6 }} /></StaggerItem>
        <StaggerItem><Stat label="Multi-brand persons" value={formatNum(multiBrandPersons)} icon={<Network size={16} />} delta={{ value: 12.1 }} /></StaggerItem>
        <StaggerItem><Stat label="Cross-brand share" value={`${(penetration * 100).toFixed(1)}%`} icon={<ShoppingBag size={16} />} delta={{ value: 2.4 }} /></StaggerItem>
        <StaggerItem><Stat label="Multi-brand CLTV" value={formatINR(multiBrandCLTV._sum.totalCLTV ?? 0)} icon={<ShoppingBag size={16} />} delta={{ value: 18.5 }} /></StaggerItem>
      </Stagger>

      <FadeIn>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Cross-sell opportunities</CardTitle>
              <CardDescription>Persons in one Unicharm brand who fit the demographic for another. Use these to drive cross-brand campaigns.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {opps.length === 0 ? (
              <p className="text-sm text-muted">No cross-sell opportunities yet. Seed the database or stitch identities.</p>
            ) : (
              <ul className="divide-y divide-border">
                {opps.map((o, i) => (
                  <li key={`${o.personId}-${i}`} className="flex flex-wrap items-center gap-4 py-3">
                    <Avatar name={o.displayName} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{o.displayName}</p>
                      <p className="mt-0.5 text-xs text-muted">{o.reason}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {o.ownedBrandSlugs.map((s: string) => (
                        <span key={s} className="h-3 w-3 rounded-full" style={{ background: brandColors[s] ?? "#888" }} title={s} />
                      ))}
                      <ArrowRight size={14} className="text-muted" />
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ background: brandColors[o.missingBrandSlug] ?? "#888" }}>
                        Suggest {o.missingBrandName}
                      </span>
                    </div>
                    <p className="w-24 text-right text-xs font-medium tabular-nums">{formatINR(o.totalCLTV)}</p>
                    <AddToCampaignButton personId={o.personId} brandSlug={o.missingBrandSlug} brandName={o.missingBrandName} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card>
          <CardHeader>
            <CardTitle>Brand overlap matrix</CardTitle>
            <CardDescription>Persons present in pair of brands</CardDescription>
          </CardHeader>
          <CardContent>
            <BrandOverlap matrix={matrix} />
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}

function BrandOverlap({ matrix }: { matrix: Matrix }) {
  const max = Math.max(1, ...matrix.flatMap((x) => x.row));
  return (
    <div className="overflow-x-auto">
      <table className="text-xs">
        <thead>
          <tr>
            <th className="p-2"></th>
            {matrix.map((m) => (
              <th key={m.brand.id} className="p-2 font-medium text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.brand.color }} />{m.brand.name}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((m) => (
            <tr key={m.brand.id}>
              <th className="p-2 text-left font-medium text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.brand.color }} />{m.brand.name}
                </span>
              </th>
              {m.row.map((v, j) => {
                const intensity = max ? v / max : 0;
                return (
                  <td key={j} className="p-1">
                    <div className="grid h-10 w-16 place-items-center rounded-md font-semibold text-white" style={{ background: `hsl(259 88% 58% / ${0.15 + intensity * 0.85})` }}>
                      {v}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[10px] text-muted">Diagonal = persons in brand. Off-diagonal = persons in both brands.</p>
    </div>
  );
}
