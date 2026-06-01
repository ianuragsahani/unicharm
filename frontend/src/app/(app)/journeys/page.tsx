import Link from "next/link";
import { serverApi } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { Stagger, StaggerItem } from "@/components/motion/fade-in";
import { GitBranch, Plus, Play, Pause } from "lucide-react";
import { formatNum, formatPct, relativeTime } from "@/lib/utils";

export default async function JourneysPage() {
  const { journeys } = await serverApi<{ journeys: any[] }>("/journeys");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journeys"
        description="Trigger-based automation workflows"
        actions={<Link href="/journeys/builder"><Button size="sm"><Plus size={14} /> New journey</Button></Link>}
      />

      {journeys.length === 0 ? (
        <Empty icon={<GitBranch />} title="No journeys yet" description="Build event-driven multi-step automations." />
      ) : (
        <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {journeys.map((j) => {
            const convRate = j.runs ? j.conversions / j.runs : 0;
            return (
              <StaggerItem key={j.id}>
                <Link href={`/journeys/${j.id}`}>
                  <Card className="group transition-all hover:shadow-pop hover:-translate-y-0.5">
                    <div className="p-5">
                      <div className="flex items-center justify-between">
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: `${j.brand.color}1a`, color: j.brand.color }}>{j.brand.name}</span>
                        <Badge variant={j.status === "ACTIVE" ? "success" : j.status === "PAUSED" ? "warning" : "default"}>
                          {j.status === "ACTIVE" ? <Play size={10} /> : j.status === "PAUSED" ? <Pause size={10} /> : null} {j.status}
                        </Badge>
                      </div>
                      <p className="mt-3 text-base font-semibold group-hover:text-brand-700">{j.name}</p>
                      <p className="mt-1 text-xs text-muted">Trigger: {j.trigger}</p>
                      <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
                        <div><p className="text-muted">Runs</p><p className="font-semibold">{formatNum(j.runs)}</p></div>
                        <div><p className="text-muted">Conv.</p><p className="font-semibold">{formatNum(j.conversions)}</p></div>
                        <div><p className="text-muted">Rate</p><p className="font-semibold text-success">{formatPct(convRate, 0)}</p></div>
                      </div>
                      <p className="mt-3 text-[10px] text-muted">Updated {relativeTime(j.updatedAt)}</p>
                    </div>
                  </Card>
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}
    </div>
  );
}
