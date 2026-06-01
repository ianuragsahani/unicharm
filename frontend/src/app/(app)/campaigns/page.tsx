import Link from "next/link";
import { serverApi } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Empty } from "@/components/ui/empty";
import { Stagger, StaggerItem } from "@/components/motion/fade-in";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Megaphone, Plus, Mail, MessageCircle, Bell, Smartphone } from "lucide-react";
import { formatINR, formatNum, formatPct, relativeTime } from "@/lib/utils";

const ICON: Record<string, any> = { EMAIL: Mail, WHATSAPP: MessageCircle, SMS: Smartphone, PUSH: Bell };
const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "info" | "danger"> = {
  DRAFT: "default", SCHEDULED: "info", RUNNING: "success", COMPLETED: "default", PAUSED: "warning",
};

export default async function CampaignsPage() {
  const { campaigns } = await serverApi<{ campaigns: any[] }>("/campaigns");

  const agg = campaigns.reduce(
    (a, c) => ({ sent: a.sent + c.sent, clicked: a.clicked + c.clicked, revenue: a.revenue + c.revenue }),
    { sent: 0, clicked: 0, revenue: 0 },
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns"
        description="Multi-channel marketing automation"
        actions={<Link href="/campaigns/new"><Button size="sm"><Plus size={14} /> New campaign</Button></Link>}
      />

      <Stagger className="grid gap-4 md:grid-cols-3">
        <StaggerItem><Card><div className="p-5"><p className="text-xs text-muted">Total sent</p><p className="mt-1 text-2xl font-semibold">{formatNum(agg.sent)}</p></div></Card></StaggerItem>
        <StaggerItem><Card><div className="p-5"><p className="text-xs text-muted">Avg CTR</p><p className="mt-1 text-2xl font-semibold">{agg.sent ? formatPct(agg.clicked / agg.sent) : "—"}</p></div></Card></StaggerItem>
        <StaggerItem><Card><div className="p-5"><p className="text-xs text-muted">Attributed revenue</p><p className="mt-1 text-2xl font-semibold">{formatINR(agg.revenue)}</p></div></Card></StaggerItem>
      </Stagger>

      {campaigns.length === 0 ? (
        <Empty icon={<Megaphone />} title="No campaigns yet" description="Create your first multi-channel campaign." />
      ) : (
        <Card>
          <Table>
            <Thead>
              <Tr>
                <Th>Campaign</Th>
                <Th>Channel</Th>
                <Th>Status</Th>
                <Th className="text-right">Sent</Th>
                <Th className="text-right">CTR</Th>
                <Th className="text-right">Conv.</Th>
                <Th className="text-right">Revenue</Th>
                <Th>Updated</Th>
              </Tr>
            </Thead>
            <Tbody>
              {campaigns.map((c) => {
                const Icon = ICON[c.channel] ?? Mail;
                const ctr = c.sent ? c.clicked / c.sent : 0;
                return (
                  <Tr key={c.id}>
                    <Td>
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.brand.color }} />
                        <div>
                          <p className="text-sm font-medium">{c.name}</p>
                          <p className="text-xs text-muted">{c.brand.name}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <span className="inline-flex items-center gap-1.5 text-sm"><Icon size={14} className="text-muted" />{c.channel}</span>
                    </Td>
                    <Td><Badge variant={STATUS_VARIANT[c.status]}>{c.status}</Badge></Td>
                    <Td className="text-right tabular-nums">{formatNum(c.sent)}</Td>
                    <Td className="text-right tabular-nums">{formatPct(ctr)}</Td>
                    <Td className="text-right tabular-nums">{formatNum(c.converted)}</Td>
                    <Td className="text-right font-medium tabular-nums">{formatINR(c.revenue)}</Td>
                    <Td className="text-xs text-muted">{relativeTime(c.updatedAt)}</Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}
