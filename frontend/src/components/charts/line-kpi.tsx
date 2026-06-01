"use client";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { formatINR } from "@/lib/utils";

export function LineKpi({ data }: { data: { label: string; value: number }[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <defs>
            <linearGradient id="grad-rev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(259 88% 58%)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="hsl(259 88% 58%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="hsl(220 13% 91%)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} width={50} />
          <Tooltip
            contentStyle={{ borderRadius: 10, border: "1px solid hsl(220 13% 91%)", fontSize: 12 }}
            formatter={(v: number) => [formatINR(v), "Revenue"]}
          />
          <Area type="monotone" dataKey="value" stroke="hsl(259 88% 58%)" strokeWidth={2} fill="url(#grad-rev)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
