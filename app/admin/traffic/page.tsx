"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, Eye, Users, Clock, MousePointerClick } from "lucide-react";
import { TrafficLineChart, TrafficBarChart, TrafficPieChart } from "@/components/admin/traffic-charts";
import { TrafficTable } from "@/components/admin/traffic-table";
import { MetricCard } from "@/components/metric-card";

export default function TrafficAnalyticsPage() {
  const [range, setRange] = useState("30"); // days
  
  // Use a stable date reference (today at midnight or similar) to avoid infinite loops with useQuery
  // when component re-renders. We'll refresh it only when range changes.
  const [now] = useState(new Date());
  const to = now.getTime();
  const from = to - (parseInt(range) * 24 * 60 * 60 * 1000);

  // Queries
  const summary = useQuery(api.traffic.getSummary, { from, to });
  const trends = useQuery(api.traffic.getTrends, { from, to, interval: parseInt(range) <= 7 ? "daily" : "daily" }); // Always daily for now unless range is huge
  const pages = useQuery(api.traffic.getPages, { from, to });
  const sources = useQuery(api.traffic.getSources, { from, to });
  const logs = useQuery(api.traffic.getLogs, { limit: 50 });

  // Handle Export
  const handleExport = () => {
    if (!logs) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Timestamp,Path,Source,Location,Device\n"
      + logs.map(l => `${new Date(l.timestamp).toISOString()},${l.path},${l.referrer || "Direct"},${l.city || "Unknown"},${l.device_type || "Unknown"}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "traffic_logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 p-8 pt-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Traffic Analytics</h2>
          <p className="text-muted-foreground">Detailed website traffic statistics and visitor insights.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select 
            value={range} 
            onChange={(e) => setRange(e.target.value)}
            className="w-[180px]"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </Select>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Page Views"
          value={summary?.totalViews?.toLocaleString() || "0"}
          subtext="Total visits in period"
          colorVar="--card-blue"
          icon={Eye}
        />
        <MetricCard
          label="Unique Visitors"
          value={summary?.uniqueVisitors?.toLocaleString() || "0"}
          subtext="Distinct users"
          colorVar="--card-green"
          icon={Users}
        />
        <MetricCard
          label="Bounce Rate"
          value={`${summary?.bounceRate?.toFixed(1) || "0"}%`}
          subtext="Single page sessions"
          colorVar="--card-orange"
          icon={MousePointerClick}
        />
        <MetricCard
          label="Avg. Session"
          value="0m 0s" 
          subtext="Duration per session"
          colorVar="--card-purple"
          icon={Clock}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <TrafficLineChart data={trends || []} />
        </div>
        <div className="col-span-3">
          <TrafficPieChart 
            data={sources?.map(s => ({ name: s.source, count: s.count })) || []} 
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-3">
          <TrafficBarChart data={pages || []} />
        </div>
        <div className="col-span-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <TrafficTable logs={logs || []} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
