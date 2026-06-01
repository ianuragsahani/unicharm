import { getSessionUser } from "@/lib/session";
import { serverApi } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { CampaignForm } from "./form";

export default async function NewCampaignPage({ searchParams }: { searchParams: Promise<{ segment?: string }> }) {
  const user = await getSessionUser();
  const sp = await searchParams;
  const { segments } = await serverApi<{ segments: any[] }>("/segments");

  return (
    <div className="space-y-6">
      <PageHeader title="New campaign" description="Configure channel, audience, content, and schedule" />
      <CampaignForm brands={user.brands} segments={segments.map((s) => ({ id: s.id, name: s.name, brandId: s.brandId, brandName: s.brand.name, size: s.size }))} defaultSegmentId={sp.segment} />
    </div>
  );
}
