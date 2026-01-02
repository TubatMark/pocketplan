"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUserKey } from "@/lib/session";
import { Users, UserCheck, UserX, Activity } from "lucide-react";

export default function AdminDashboardPage() {
  const userKey = useUserKey();
  const stats = useQuery(api.admin.getDashboardStats, { userKey });

  const metrics = [
    {
      title: "Total Users",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Active (30d)",
      value: stats?.activeUsers ?? 0,
      icon: UserCheck,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      title: "Inactive",
      value: stats?.inactiveUsers ?? 0,
      icon: UserX,
      color: "text-gray-600",
      bg: "bg-gray-100",
    },
    {
      title: "Transactions",
      value: stats?.totalTransactions?.toLocaleString() ?? 0,
      icon: Activity,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground text-sm sm:text-base">Overview of system performance and user statistics.</p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">
                  {metric.title}
                </CardTitle>
                <div className={`rounded-full p-1.5 sm:p-2 ${metric.bg} shrink-0`}>
                  <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold truncate">{metric.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts and System Health */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">User Growth</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
             <div className="h-[160px] sm:h-[180px] md:h-[200px] flex items-center justify-center text-gray-400 border border-dashed rounded-lg">
                <div className="text-center">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Chart Placeholder</p>
                </div>
             </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">System Health</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">Performance Score</span>
                    <span className="text-sm font-bold text-green-600">{stats?.performanceScore ?? 0}/100</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${stats?.performanceScore ?? 0}%` }}></div>
                </div>
                <p className="text-xs text-muted-foreground">System is running smoothly.</p>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
