"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";

export function ChannelBars({ data }: { data: { channel: string; sent: number; ctr: number; conv: number }[] }) {
  const fmt = data.map((d) => ({ ...d, ctrPct: +(d.ctr * 100).toFixed(1), convPct: +(d.conv * 100).toFixed(2) }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={fmt} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <CartesianGrid stroke="hsl(220 13% 91%)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="channel" tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} width={40} />
          <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid hsl(220 13% 91%)", fontSize: 12 }} formatter={(v: number, n: string) => [`${v}%`, n]} />
          <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
          <Bar dataKey="ctrPct" fill="hsl(259 88% 58%)" radius={[6, 6, 0, 0]} name="CTR" />
          <Bar dataKey="convPct" fill="hsl(142 76% 41%)" radius={[6, 6, 0, 0]} name="Conversion" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
