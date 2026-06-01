import { getSessionUser } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { SegmentBuilder } from "./builder";

export default async function NewSegmentPage() {
  const user = await getSessionUser();
  return (
    <div className="space-y-6">
      <PageHeader title="New segment" description="Compose rules and preview matching customers in real-time" />
      <SegmentBuilder brands={user.brands} />
    </div>
  );
}
