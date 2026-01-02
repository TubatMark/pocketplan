"use client";

import { useState } from "react";
import { useQuery, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, Eye, Users, Clock, MousePointerClick, ChevronLeft, ChevronRight } from "lucide-react";
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

  // Pagination
  const { results: logs, status, loadMore, isLoading } = usePaginatedQuery(
    api.traffic.getLogs,
    {},
    { initialNumItems: 10 }
  );

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // We are implementing client-side pagination on top of the incrementally loaded data
  // "Next" will trigger `loadMore` if we need more data

  const totalLoaded = logs.length;
  const maxPageLoaded = Math.ceil(totalLoaded / itemsPerPage);

  const handleNextPage = () => {
    const nextPage = currentPage + 1;
    if (nextPage > maxPageLoaded && status === "CanLoadMore") {
      loadMore(itemsPerPage);
      // We can't immediately switch page because data isn't here yet.
      // But Convex usePaginatedQuery updates `results` reactively.
      // So we can set page, and if data is missing, we show loading?
      // Better: loadMore returns a promise? No.
      // We'll optimistically increment, and if logs[index] is undefined, we wait.
    }
    setCurrentPage(nextPage);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // Slice logs for current page
  const currentLogs = logs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Traffic Analytics</h2>
          <p className="text-muted-foreground text-sm sm:text-base">Detailed website traffic statistics and visitor insights.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <Select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="w-[140px] sm:w-[180px]"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </Select>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="hidden sm:flex">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="sm:hidden px-3">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Page Views"
          value={summary?.totalViews?.toLocaleString() || "0"}
          subtext="Total visits"
          colorVar="--card-blue"
          icon={Eye}
        />
        <MetricCard
          label="Visitors"
          value={summary?.uniqueVisitors?.toLocaleString() || "0"}
          subtext="Unique users"
          colorVar="--card-green"
          icon={Users}
        />
        <MetricCard
          label="Bounce Rate"
          value={`${summary?.bounceRate?.toFixed(1) || "0"}%`}
          subtext="Single page"
          colorVar="--card-orange"
          icon={MousePointerClick}
        />
        <MetricCard
          label="Avg Session"
          value="0m 0s"
          subtext="Duration"
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
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="text-base sm:text-lg">Recent Activity</CardTitle>
              <div className="flex items-center gap-1 sm:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="h-8 w-8 sm:w-auto p-0 sm:px-3"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Prev</span>
                </Button>
                <span className="text-xs sm:text-sm text-muted-foreground min-w-[3rem] text-center">
                  {currentPage}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={status === "Exhausted" && currentPage >= maxPageLoaded}
                  className="h-8 w-8 sm:w-auto p-0 sm:px-3"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <TrafficTable
                logs={currentLogs || []}
                status={status}
                loadMore={loadMore}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
