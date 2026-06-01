import Link from "next/link";
import { serverApi } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion/fade-in";
import { Sparkles, AlertTriangle, Layers3, MessageSquare } from "lucide-react";
import { formatINR, formatNum } from "@/lib/utils";
import { SentimentChecker } from "./sentiment";

export default async function AIPage() {
  const data = await serverApi<{ churnRisk: any[]; suggestions: any[]; highRiskCount: number }>("/ai/overview");
  const churnRisk = data.churnRisk;
  const suggestions = data.suggestions;
  const highRiskCount = data.highRiskCount;

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI & Personalization"
        description="Churn prediction · Lifecycle · Smart segments · Sentiment · Recommendations"
      />

      <Stagger className="grid gap-4 md:grid-cols-4">
        <StaggerItem>
          <Card className="bg-gradient-to-br from-brand-600 to-brand-800 text-white border-0">
            <div className="p-5">
              <Sparkles size={20} className="opacity-80" />
              <p className="mt-3 text-sm opacity-80">Heuristic models</p>
              <p className="mt-1 text-2xl font-semibold">5 active</p>
            </div>
          </Card>
        </StaggerItem>
        <StaggerItem><Card><CardContent className="pt-5"><AlertTriangle className="text-warning" size={18} /><p className="mt-2 text-xs text-muted">High churn risk</p><p className="mt-1 text-2xl font-semibold">{formatNum(highRiskCount)}</p></CardContent></Card></StaggerItem>
        <StaggerItem><Card><CardContent className="pt-5"><Layers3 className="text-brand-600" size={18} /><p className="mt-2 text-xs text-muted">Smart segments</p><p className="mt-1 text-2xl font-semibold">{formatNum(suggestions.length)}</p></CardContent></Card></StaggerItem>
        <StaggerItem><Card><CardContent className="pt-5"><MessageSquare className="text-success" size={18} /><p className="mt-2 text-xs text-muted">Sentiment ready</p><p className="mt-1 text-2xl font-semibold">Live</p></CardContent></Card></StaggerItem>
      </Stagger>

      <div className="grid gap-4 lg:grid-cols-3">
        <FadeIn className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2"><AlertTriangle size={14} className="text-warning" /> Top churn risks</CardTitle>
                <CardDescription>Sorted by churn score</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {churnRisk.map((c) => (
                  <li key={c.customerId} className="flex items-center gap-3 py-3">
                    <Avatar name={c.customer.name} size={32} />
                    <div className="min-w-0 flex-1">
                      <Link href={`/customers/${c.customer.id}`} className="text-sm font-medium hover:text-brand-700">{c.customer.name}</Link>
                      <p className="text-xs text-muted">{c.reason}</p>
                    </div>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: `${c.customer.brand.color}1a`, color: c.customer.brand.color }}>{c.customer.brand.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-100">
                        <div className="h-full bg-danger" style={{ width: `${c.score * 100}%` }} />
                      </div>
                      <span className="w-10 text-right text-xs font-semibold text-danger">{(c.score * 100).toFixed(0)}%</span>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.1}>
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2"><Layers3 size={14} className="text-brand-600" /> Smart segments</CardTitle>
                <CardDescription>AI-suggested cohorts</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5">
                {suggestions.map((s, i) => (
                  <li key={i} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{s.name}</p>
                      <span className="rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{ background: `${s.color}1a`, color: s.color }}>{s.brandName}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted">
                      <span>{formatNum(s.size)} customers</span>
                      <span>Avg CLTV {formatINR(s.avgCLTV)}</span>
                    </div>
                    <p className="mt-2 text-[11px] text-brand-700">Suggested: {s.suggested}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2"><MessageSquare size={14} className="text-success" /> Sentiment analysis</CardTitle>
            <CardDescription>Try inbound message classifier</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <SentimentChecker />
        </CardContent>
      </Card>
    </div>
  );
}
