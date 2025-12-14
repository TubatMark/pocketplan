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
      title: "Active Users (30d)",
      value: stats?.activeUsers ?? 0,
      icon: UserCheck,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      title: "Inactive Users",
      value: stats?.inactiveUsers ?? 0,
      icon: UserX,
      color: "text-gray-600",
      bg: "bg-gray-100",
    },
    {
      title: "Total Transactions",
      value: stats?.totalTransactions?.toLocaleString() ?? 0,
      icon: Activity,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Overview of system performance and user statistics.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <div className={`rounded-full p-2 ${metric.bg}`}>
                  <Icon className={`h-4 w-4 ${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Placeholder for charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
             <div className="h-[200px] flex items-center justify-center text-gray-400 border border-dashed rounded">
                Chart Placeholder
             </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Performance Score</span>
                    <span className="text-sm font-bold text-green-600">{stats?.performanceScore ?? 0}/100</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: `${stats?.performanceScore ?? 0}%` }}></div>
                </div>
                <p className="text-xs text-muted-foreground">System is running smoothly.</p>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
