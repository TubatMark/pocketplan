"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/hooks/use-data";
import { useUserKey } from "@/lib/session";
import { ActivityList } from "@/components/activity-list";
import { TransactionListSkeleton } from "@/components/skeletons";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

const ITEMS_PER_PAGE = 10;

export default function ActivitiesPage() {
  const userKey = useUserKey();
  const { data: activities, isLoading } = useData<any[]>("activities:list" as any, { userKey } as any);

  // Filter State
  const [filterType, setFilterType] = useState<"all" | "income" | "expense" | "transfer" | "wallet_create" | "debt">("all");
  const [dateRange, setDateRange] = useState<"all" | "today" | "week" | "month">("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter Logic
  const filteredActivities = useMemo(() => {
    if (!activities) return [];

    let filtered = [...activities];

    // Filter by Type
    if (filterType !== "all") {
      filtered = filtered.filter(a => {
        if (filterType === "wallet_create") return a.type === "wallet_create";
        if (filterType === "debt") return a.type.includes("debt");
        return a.type === filterType;
      });
    }

    // Filter by Date
    if (dateRange !== "all") {
      const now = new Date();
      const startOfDay = new Date(now.setHours(0, 0, 0, 0)).getTime();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).setHours(0, 0, 0, 0);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

      filtered = filtered.filter(a => {
        if (dateRange === "today") return a.created_at >= startOfDay;
        if (dateRange === "week") return a.created_at >= startOfWeek;
        if (dateRange === "month") return a.created_at >= startOfMonth;
        return true;
      });
    }

    return filtered.sort((a, b) => b.created_at - a.created_at);
  }, [activities, filterType, dateRange]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredActivities.length / ITEMS_PER_PAGE);
  const paginatedActivities = filteredActivities.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">All Activities</h2>
            <p className="text-muted-foreground">View and filter your entire activity history.</p>
          </div>
          
          <div className="flex gap-2">
            <Select 
              value={filterType} 
              onChange={(e) => {
                setFilterType(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-[150px]"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="transfer">Transfer</option>
              <option value="debt">Debt</option>
              <option value="wallet_create">System</option>
            </Select>

            <Select 
              value={dateRange} 
              onChange={(e) => {
                setDateRange(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-[150px]"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </Select>
          </div>
        </div>

        <Card className="border-none shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6">
                <TransactionListSkeleton />
              </div>
            ) : filteredActivities.length > 0 ? (
              <>
                <div className="p-6">
                  <ActivityList activities={paginatedActivities} />
                </div>
                
                {/* Pagination Controls */}
                <div className="flex items-center justify-between border-t px-6 py-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredActivities.length)} of {filteredActivities.length} results
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="text-sm font-medium">
                      Page {currentPage} of {totalPages}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center text-center">
                <div className="rounded-full bg-muted p-4">
                  <CalendarIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">No activities found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your filters to see more results.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
