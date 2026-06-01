import { getSessionUser } from "@/lib/session";
import { serverApi } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { JourneyBuilder } from "./builder";
import { parseJSON } from "@/lib/utils";

export default async function JourneyBuilderPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const user = await getSessionUser();
  const sp = await searchParams;

  const data = await serverApi<{ segments: any[]; templates: any[]; existing: any }>(
    `/journeys/builder/data${sp.id ? `?id=${encodeURIComponent(sp.id)}` : ""}`,
  );
  const { segments, templates, existing } = data;

  const initial = existing
    ? {
        id: existing.id,
        brandId: existing.brandId,
        name: existing.name,
        trigger: existing.trigger,
        triggerConfig: parseJSON(existing.triggerConfig, {}),
        status: existing.status as "DRAFT" | "ACTIVE" | "PAUSED",
        graph: parseJSON<{ nodes: any[]; edges: any[] }>(existing.graph, { nodes: [], edges: [] }),
      }
    : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title={existing ? `Edit: ${existing.name}` : "Journey builder"}
        description={existing ? "Modify nodes, trigger, and edges. Save to update." : "Add nodes, configure each step, wire them, then activate."}
      />
      <JourneyBuilder brands={user.brands} segments={segments} templates={templates} initial={initial} />
    </div>
  );
}
