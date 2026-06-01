"use client";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatINR } from "@/lib/utils";

export function AttributionPie({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((a, x) => a + x.value, 0);
  return (
    <div>
      <div className="h-44 w-full">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={48} outerRadius={70} paddingAngle={2}>
              {data.map((d, i) => <Cell key={i} fill={d.color} stroke="white" strokeWidth={2} />)}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid hsl(220 13% 91%)", fontSize: 12 }} formatter={(v: number) => formatINR(v)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-3 space-y-1.5 text-xs">
        {data.map((d) => (
          <li key={d.name} className="flex items-center justify-between">
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />{d.name}</span>
            <span className="tabular-nums">{formatINR(d.value)} <span className="text-muted">· {total ? ((d.value / total) * 100).toFixed(1) : 0}%</span></span>
          </li>
        ))}
      </ul>
    </div>
  );
}
