import { notFound } from "next/navigation";
import Link from "next/link";
import { serverApi } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JourneyCanvas } from "./canvas";
import { JourneyStatusButton } from "./status-button";
import { JourneyRunButton } from "./run-button";
import { parseJSON, formatNum, formatPct } from "@/lib/utils";
import { Pencil } from "lucide-react";

export default async function JourneyDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let j: any;
  try {
    j = (await serverApi<{ journey: any }>(`/journeys/${id}`)).journey;
  } catch {
    notFound();
  }

  const graph = parseJSON<{ nodes: any[]; edges: any[] }>(j.graph, { nodes: [], edges: [] });
  const triggerCfg = parseJSON<Record<string, any>>(j.triggerConfig, {});
  const convRate = j.runs ? j.conversions / j.runs : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={j.name}
        description={`${j.brand.name} · Trigger: ${j.trigger}`}
        actions={
          <>
            <Badge variant={j.status === "ACTIVE" ? "success" : j.status === "PAUSED" ? "warning" : "default"}>{j.status}</Badge>
            <JourneyRunButton id={j.id} />
            <JourneyStatusButton id={j.id} status={j.status as "DRAFT" | "ACTIVE" | "PAUSED"} />
            <Link href={`/journeys/builder?id=${j.id}`}>
              <Button size="sm"><Pencil size={14} /> Edit</Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-5"><p className="text-xs text-muted">Runs</p><p className="mt-1 text-2xl font-semibold">{formatNum(j.runs)}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted">Conversions</p><p className="mt-1 text-2xl font-semibold">{formatNum(j.conversions)}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted">Conv. rate</p><p className="mt-1 text-2xl font-semibold text-success">{formatPct(convRate, 1)}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted">Steps</p><p className="mt-1 text-2xl font-semibold">{graph.nodes.length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Trigger configuration</CardTitle>
            <CardDescription>How customers enter this journey</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <div><dt className="text-xs text-muted">Type</dt><dd className="font-medium">{j.trigger}</dd></div>
            {Object.entries(triggerCfg).map(([k, v]) => (
              <div key={k}><dt className="text-xs text-muted">{k}</dt><dd className="font-medium truncate">{String(v)}</dd></div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Flow</CardTitle></CardHeader>
        <CardContent>
          <JourneyCanvas nodes={graph.nodes} edges={graph.edges} />
        </CardContent>
      </Card>
    </div>
  );
}
