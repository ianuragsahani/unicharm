import { notFound } from "next/navigation";
import Link from "next/link";
import { serverApi } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { LifecycleBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { formatINR, formatNum } from "@/lib/utils";
import { Megaphone } from "lucide-react";

export default async function SegmentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let data: { segment: any; rules: any; members: any[]; count: number };
  try {
    data = await serverApi(`/segments/${id}`);
  } catch {
    notFound();
  }
  const s = data!.segment;
  const rules = data!.rules;
  const members = data!.members;
  const count = data!.count;

  return (
    <div className="space-y-6">
      <PageHeader
        title={s.name}
        description={s.description ?? undefined}
        actions={
          <>
            <Link href={`/campaigns/new?segment=${s.id}`}>
              <Button size="sm"><Megaphone size={14} /> Launch campaign</Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-5"><p className="text-xs text-muted">Size</p><p className="mt-1 text-2xl font-semibold">{formatNum(count)}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted">Brand</p><p className="mt-1 text-2xl font-semibold">{s.brand.name}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted">Rules</p><p className="mt-1 text-2xl font-semibold">{rules.all?.length ?? 0}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Rule definition</CardTitle></CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-xs text-zinc-100 font-mono">{JSON.stringify(rules, null, 2)}</pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Members preview</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <Thead>
              <Tr><Th>Customer</Th><Th>Lifecycle</Th><Th>City</Th><Th className="text-right">Orders</Th><Th className="text-right">CLTV</Th></Tr>
            </Thead>
            <Tbody>
              {members.map((c) => (
                <Tr key={c.id}>
                  <Td>
                    <Link href={`/customers/${c.id}`} className="flex items-center gap-3 hover:text-brand-700">
                      <Avatar name={c.name} size={28} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{c.name}</p>
                        <p className="text-xs text-muted truncate">{c.email}</p>
                      </div>
                    </Link>
                  </Td>
                  <Td><LifecycleBadge value={c.lifecycle} /></Td>
                  <Td className="text-sm">{c.city ?? "—"}</Td>
                  <Td className="text-right tabular-nums">{c.totalOrders}</Td>
                  <Td className="text-right font-medium tabular-nums">{formatINR(c.cltv)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
