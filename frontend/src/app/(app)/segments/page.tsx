import Link from "next/link";
import { serverApi } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { Stagger, StaggerItem } from "@/components/motion/fade-in";
import { Filter, Plus, Users } from "lucide-react";
import { formatNum, relativeTime } from "@/lib/utils";

export default async function SegmentsPage() {
  const { segments } = await serverApi<{ segments: any[] }>("/segments");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Segments"
        description="Rule-based audiences for targeted engagement"
        actions={<Link href="/segments/new"><Button size="sm"><Plus size={14} /> New segment</Button></Link>}
      />

      {segments.length === 0 ? (
        <Empty icon={<Filter />} title="No segments yet" description="Create rules to slice your customer base." action={<Link href="/segments/new"><Button size="sm">Build first segment</Button></Link>} />
      ) : (
        <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {segments.map((s) => (
            <StaggerItem key={s.id}>
              <Link href={`/segments/${s.id}`}>
                <Card className="group transition-all hover:shadow-pop hover:-translate-y-0.5">
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: `${s.brand.color}1a`, color: s.brand.color }}>{s.brand.name}</span>
                      <span className="text-xs text-muted">{relativeTime(s.updatedAt)}</span>
                    </div>
                    <p className="mt-3 text-base font-semibold group-hover:text-brand-700">{s.name}</p>
                    {s.description && <p className="mt-1 text-xs text-muted line-clamp-2">{s.description}</p>}
                    <div className="mt-4 flex items-center gap-2 text-sm">
                      <Users size={14} className="text-muted" />
                      <span className="font-medium">{formatNum(s.size)}</span>
                      <span className="text-muted">members</span>
                    </div>
                  </div>
                </Card>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}
