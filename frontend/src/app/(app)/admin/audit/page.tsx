import { serverApi } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Empty } from "@/components/ui/empty";
import { ScrollText } from "lucide-react";
import { relativeTime } from "@/lib/utils";

export default async function AuditPage() {
  const { logs } = await serverApi<{ logs: any[] }>("/admin/audit");

  return (
    <div className="space-y-6">
      <PageHeader title="Audit log" description="Last 100 actions (immutable)" />
      {logs.length === 0 ? (
        <Empty icon={<ScrollText />} title="No audit events yet" />
      ) : (
        <Card>
          <Table>
            <Thead>
              <Tr><Th>When</Th><Th>User</Th><Th>Action</Th><Th>Entity</Th><Th>Metadata</Th></Tr>
            </Thead>
            <Tbody>
              {logs.map((l) => (
                <Tr key={l.id}>
                  <Td className="text-xs text-muted">{relativeTime(l.createdAt)}</Td>
                  <Td className="text-sm">{l.user?.name ?? "System"}</Td>
                  <Td><code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-mono">{l.action}</code></Td>
                  <Td className="text-xs text-muted">{l.entityType ? `${l.entityType}:${l.entityId?.slice(-6)}` : "—"}</Td>
                  <Td className="text-xs text-muted truncate max-w-xs">{l.metadata ?? "—"}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}
