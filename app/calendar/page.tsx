"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { CalendarGrid, getDayKey } from "@/components/calendar-grid";
import { CalendarDayDetail } from "@/components/calendar-day-detail";
import { useData } from "@/hooks/use-data";
import { useUserKey } from "@/lib/session";
import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import type { DaySummary } from "@/components/calendar-grid";

function CalendarContent() {
  const userKey = useUserKey();
  const [currentMonth, setCurrentMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [mobileDetail, setMobileDetail] = useState(false);

  // Fetch range: previous month start → current month end (for trends)
  const prevMonth = subMonths(currentMonth, 1);
  const fetchFrom = startOfMonth(prevMonth).getTime();
  const fetchTo = endOfMonth(currentMonth).getTime();

  const { data: transactions, isLoading: isTxLoading, error: txError } = useData<any[]>(
    "transactions:list" as any,
    { userKey, from: fetchFrom, to: fetchTo } as any
  );
  const { data: wallets } = useData<any[]>("wallets:list" as any, { userKey } as any);

  // Split transactions into current and previous month
  const currentStart = startOfMonth(currentMonth).getTime();
  const currentEnd = endOfMonth(currentMonth).getTime();
  const prevStart = startOfMonth(prevMonth).getTime();
  const prevEnd = endOfMonth(prevMonth).getTime();

  const currentTxs = useMemo(() =>
    (transactions ?? []).filter((t: any) => t.created_at >= currentStart && t.created_at <= currentEnd),
    [transactions, currentStart, currentEnd]
  );

  const prevTxs = useMemo(() =>
    (transactions ?? []).filter((t: any) => t.created_at >= prevStart && t.created_at <= prevEnd),
    [transactions, prevStart, prevEnd]
  );

  // Monthly totals
  const monthIncome = useMemo(() =>
    currentTxs.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + t.amount, 0),
    [currentTxs]
  );
  const monthExpense = useMemo(() =>
    currentTxs.filter((t: any) => t.type === "expense" || t.type === "savings" || t.type === "debt_payment").reduce((s: number, t: any) => s + t.amount, 0),
    [currentTxs]
  );
  const monthTransfer = useMemo(() =>
    currentTxs.filter((t: any) => t.type === "transfer").reduce((s: number, t: any) => s + t.amount, 0),
    [currentTxs]
  );

  // Previous month totals for trends
  const prevIncome = prevTxs.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + t.amount, 0);
  const prevExpense = prevTxs.filter((t: any) => t.type === "expense" || t.type === "savings" || t.type === "debt_payment").reduce((s: number, t: any) => s + t.amount, 0);
  const prevTransfer = prevTxs.filter((t: any) => t.type === "transfer").reduce((s: number, t: any) => s + t.amount, 0);

  const calcTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const formatTrend = (val: number) => {
    const abs = Math.abs(val).toFixed(1);
    return `${val >= 0 ? "+" : "-"}${abs}% from last month`;
  };

  // Build day summaries map
  const daySummaries = useMemo(() => {
    const map: Record<string, DaySummary> = {};
    for (const tx of currentTxs) {
      const d = new Date(tx.created_at);
      const key = getDayKey(d);
      if (!map[key]) map[key] = { income: 0, expense: 0, transfer: 0 };
      if (tx.type === "income") map[key].income += tx.amount;
      else if (tx.type === "transfer") map[key].transfer += tx.amount;
      else map[key].expense += tx.amount; // expense, savings, debt_payment
    }
    return map;
  }, [currentTxs]);

  const goToday = () => {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDay(now);
    setMobileDetail(false);
  };

  const goPrev = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDay(null);
    setMobileDetail(false);
  };

  const goNext = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedDay(null);
    setMobileDetail(false);
  };

  const handleSelectDay = (day: Date) => {
    setSelectedDay(day);
    setMobileDetail(true);
  };

  const handleBack = () => {
    setMobileDetail(false);
  };

  // Loading skeleton
  if (isTxLoading) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div className="h-8 w-40 bg-gray-200 rounded-lg animate-pulse" />
            <div className="flex gap-2">
              <div className="h-9 w-9 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-9 w-16 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-9 w-9 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>
          {/* Summary cards skeleton */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 sm:h-24 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
          {/* Calendar skeleton */}
          <div className="h-[400px] bg-gray-200 rounded-2xl animate-pulse" />
        </div>
      </DashboardShell>
    );
  }

  // Error state
  if (txError) {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-gray-500 mb-4">Failed to load transactions</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Retry
          </button>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-4 sm:space-y-6">
        {/* Month Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {format(currentMonth, "MMMM yyyy")}
          </h1>
          <div className="flex items-center gap-1.5">
            <button
              onClick={goPrev}
              className="flex items-center justify-center h-9 w-9 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goToday}
              className="px-3 py-2 rounded-xl bg-gray-900 text-white text-xs font-medium hover:bg-gray-800 transition-colors"
            >
              Today
            </button>
            <button
              onClick={goNext}
              className="flex items-center justify-center h-9 w-9 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-2xl p-3 sm:p-4" style={{ backgroundColor: "hsl(140, 60%, 92%)" }}>
            <div className="text-[10px] sm:text-xs text-gray-600 mb-1">Total Income</div>
            <div className="text-base sm:text-xl font-bold text-gray-900">₱{monthIncome.toLocaleString()}</div>
            <div className={`text-[9px] sm:text-[10px] mt-0.5 ${calcTrend(monthIncome, prevIncome) >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatTrend(calcTrend(monthIncome, prevIncome))}
            </div>
          </div>
          <div className="rounded-2xl p-3 sm:p-4" style={{ backgroundColor: "hsl(25, 100%, 92%)" }}>
            <div className="text-[10px] sm:text-xs text-gray-600 mb-1">Total Expenses</div>
            <div className="text-base sm:text-xl font-bold text-gray-900">₱{monthExpense.toLocaleString()}</div>
            <div className={`text-[9px] sm:text-[10px] mt-0.5 ${calcTrend(monthExpense, prevExpense) <= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatTrend(calcTrend(monthExpense, prevExpense))}
            </div>
          </div>
          <div className="rounded-2xl p-3 sm:p-4" style={{ backgroundColor: "hsl(210, 80%, 94%)" }}>
            <div className="text-[10px] sm:text-xs text-gray-600 mb-1">Total Transfers</div>
            <div className="text-base sm:text-xl font-bold text-gray-900">₱{monthTransfer.toLocaleString()}</div>
            <div className="text-[9px] sm:text-[10px] mt-0.5 text-gray-500">
              {currentTxs.filter((t: any) => t.type === "transfer").length} transfers this month
            </div>
          </div>
        </div>

        {/* Mobile: show detail or calendar */}
        <div className="xl:hidden">
          {mobileDetail && selectedDay ? (
            <CalendarDayDetail
              selectedDay={selectedDay}
              transactions={currentTxs}
              wallets={wallets ?? []}
              onBack={handleBack}
              isMobile
            />
          ) : (
            <>
              <CalendarGrid
                currentMonth={currentMonth}
                daySummaries={daySummaries}
                selectedDay={selectedDay}
                onSelectDay={handleSelectDay}
              />
              <p className="text-center text-[10px] text-gray-400 mt-2">Tap a day to view transactions</p>
            </>
          )}
        </div>

        {/* Desktop: calendar + side panel */}
        <div className="hidden xl:grid xl:grid-cols-[1fr_300px] gap-4">
          <CalendarGrid
            currentMonth={currentMonth}
            daySummaries={daySummaries}
            selectedDay={selectedDay}
            onSelectDay={(day) => setSelectedDay(day)}
          />
          <CalendarDayDetail
            selectedDay={selectedDay}
            transactions={currentTxs}
            wallets={wallets ?? []}
          />
        </div>
      </div>
    </DashboardShell>
  );
}

export default function CalendarPage() {
  return <CalendarContent />;
}
