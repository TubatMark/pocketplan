"use client";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, Calendar } from "lucide-react";

export function TransferChart({ data, total }: { data: any[], total?: number }) {
  // Mock data if empty
  const chartData = data?.length ? data : [
    { day: "Sun", amount: 0 },
    { day: "Mon", amount: 0 },
    { day: "Tue", amount: 0 },
    { day: "Wed", amount: 0 },
    { day: "Thu", amount: 0 },
    { day: "Fri", amount: 0 },
    { day: "Sat", amount: 0 },
  ];

  return (
    <Card className="border-none bg-blue-600 text-white shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between border-none pb-2">
        <div>
          <CardTitle className="text-lg font-medium text-white/90">Transfers</CardTitle>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-2xl font-bold">₱{(total ?? 0).toLocaleString()}</span>
            <span className="flex items-center rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium text-white">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              Volume
            </span>
          </div>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20">
          This Week
          <Calendar className="h-3 w-3" />
        </button>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={12}>
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} 
                dy={10}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', color: '#000' }}
                formatter={(value: number) => [`₱${value.toLocaleString()}`, "Transferred"]}
              />
              <Bar 
                dataKey="amount" 
                fill="rgba(255,255,255,0.9)" 
                radius={[4, 4, 4, 4]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
