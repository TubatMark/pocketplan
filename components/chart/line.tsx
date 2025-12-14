"use client";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";

export function ChartLine({ data, xKey, lines }: { data: any[]; xKey: string; lines: Array<{ key: string; name: string; colorVar: string }> }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey={xKey} stroke="var(--muted-foreground)" />
          <YAxis stroke="var(--muted-foreground)" />
          <Tooltip />
          <Legend />
          {lines.map((l, i) => (
            <Line key={l.key} type="monotone" dataKey={l.key} stroke={`var(${l.colorVar})`} name={l.name} strokeWidth={2} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

