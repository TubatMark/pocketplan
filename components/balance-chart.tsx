"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { ArrowUpRight } from "lucide-react";

interface BalanceChartProps {
  data: any[];
}

export function BalanceChart({ data }: BalanceChartProps) {
  // Calculate simple growth stats
  const current = data.length > 0 ? data[data.length - 1].balance : 0;
  const start = data.length > 0 ? data[0].balance : 0;
  const growth = start === 0 ? (current > 0 ? 100 : 0) : ((current - start) / start) * 100;

  return (
    <Card className="border-none bg-indigo-900 text-white shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between border-none pb-2">
        <div>
          <CardTitle className="text-lg font-medium text-white/90">Total Balance</CardTitle>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-2xl font-bold">₱{(current ?? 0).toLocaleString()}</span>
            <span className={`flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${growth >= 0 ? 'bg-white/20 text-white' : 'bg-red-500/20 text-red-100'}`}>
              <ArrowUpRight className={`mr-1 h-3 w-3 ${growth < 0 && 'rotate-180'}`} />
              {Math.abs(growth).toFixed(1)}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#fff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} 
                dy={10}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
              />
              <Tooltip 
                cursor={{ stroke: 'rgba(255,255,255,0.2)' }}
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', color: '#000' }}
                formatter={(value: number) => [`₱${value.toLocaleString()}`, "Balance"]}
                labelFormatter={(label) => new Date(label).toLocaleDateString(undefined, { dateStyle: 'medium' })}
              />
              <Area 
                type="monotone" 
                dataKey="balance" 
                stroke="#fff" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorBalance)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
