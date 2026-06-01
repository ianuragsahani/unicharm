import { serverApi } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Stagger, StaggerItem } from "@/components/motion/fade-in";
import { formatNum } from "@/lib/utils";

export default async function BrandsPage() {
  const { brands } = await serverApi<{ brands: any[] }>("/admin/brands");

  return (
    <div className="space-y-6">
      <PageHeader title="Brands" description="Unicharm digital ecosystems" />
      <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {brands.map((b) => (
          <StaggerItem key={b.id}>
            <Card>
              <div className="h-20 rounded-t-2xl" style={{ background: `linear-gradient(135deg, ${b.color}, ${b.color}99)` }} />
              <CardContent className="-mt-6 pb-5">
                <div className="grid h-12 w-12 place-items-center rounded-xl border-4 border-surface text-base font-bold text-white" style={{ background: b.color }}>
                  {b.name.charAt(0)}
                </div>
                <p className="mt-3 text-base font-semibold">{b.name}</p>
                <p className="text-xs text-muted">{b.slug}</p>
                <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div><dt className="text-muted">Customers</dt><dd className="font-semibold">{formatNum(b._count.customers)}</dd></div>
                  <div><dt className="text-muted">Segments</dt><dd className="font-semibold">{formatNum(b._count.segments)}</dd></div>
                  <div><dt className="text-muted">Campaigns</dt><dd className="font-semibold">{formatNum(b._count.campaigns)}</dd></div>
                  <div><dt className="text-muted">Journeys</dt><dd className="font-semibold">{formatNum(b._count.journeys)}</dd></div>
                </dl>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
