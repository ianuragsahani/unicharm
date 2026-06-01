import { serverApi } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Stat } from "@/components/ui/stat";
import { Stagger, StaggerItem } from "@/components/motion/fade-in";
import { MessageCircle, CheckCheck, Send, Inbox } from "lucide-react";
import { formatNum, relativeTime } from "@/lib/utils";

export default async function WhatsAppPage() {
  const data = await serverApi<{ templates: any[]; recent: any[]; stats: { total: number; delivered: number; replies: number; sent24h: number } }>("/whatsapp");
  const { templates, recent } = data;
  const { total, delivered, replies, sent24h } = data.stats;

  const deliveryRate = total ? delivered / total : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="WhatsApp CRM" description="Templates, conversations, broadcasts" />

      <Stagger className="grid gap-4 md:grid-cols-4">
        <StaggerItem><Stat label="Total messages" value={formatNum(total)} icon={<MessageCircle size={16} />} delta={{ value: 18.2 }} /></StaggerItem>
        <StaggerItem><Stat label="Last 24h" value={formatNum(sent24h)} icon={<Send size={16} />} delta={{ value: 4.1 }} /></StaggerItem>
        <StaggerItem><Stat label="Delivery rate" value={`${(deliveryRate * 100).toFixed(1)}%`} icon={<CheckCheck size={16} />} delta={{ value: 0.8 }} /></StaggerItem>
        <StaggerItem><Stat label="Inbound replies" value={formatNum(replies)} icon={<Inbox size={16} />} delta={{ value: -1.2 }} /></StaggerItem>
      </Stagger>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Recent conversations</CardTitle>
              <CardDescription>Live inbox feed across all brands</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {recent.map((m) => (
                <li key={m.id} className="flex items-start gap-3 py-3">
                  <Avatar name={m.customer.name} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{m.customer.name}</p>
                      <span className="rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{ background: `${m.customer.brand.color}1a`, color: m.customer.brand.color }}>{m.customer.brand.name}</span>
                      <Badge variant={m.direction === "OUT" ? "info" : "default"}>{m.direction === "OUT" ? "Outbound" : "Reply"}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-zinc-600 line-clamp-2">{m.body}</p>
                  </div>
                  <span className="shrink-0 text-[10px] text-muted">{relativeTime(m.createdAt)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Templates</CardTitle>
              <CardDescription>Meta-approved messages</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {templates.map((t) => (
                <li key={t.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold">{t.name}</p>
                    <Badge variant="info">{t.category}</Badge>
                  </div>
                  <p className="mt-1 text-[10px] text-muted">{t.brand.name} · {t.language}</p>
                  <p className="mt-2 text-xs text-zinc-700 line-clamp-2">{t.body}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
