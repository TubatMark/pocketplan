"use client";
import { DashboardShell } from "@/components/dashboard-shell";
import { MetricCard } from "@/components/metric-card";
import { SpendingChart } from "@/components/spending-chart";
import { IncomeChart } from "@/components/income-chart";
import { TransferChart } from "@/components/transfer-chart";
import { BalanceChart } from "@/components/balance-chart";
import { TransactionList } from "@/components/transaction-list";
import { ActivityList } from "@/components/activity-list";
import { MetricExplainer } from "@/components/metric-explainer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { useUserKey } from "@/lib/session";
import { MoreHorizontal, Home, Smartphone, Zap, Wifi, Fuel, Utensils, ShoppingBag, CircleDollarSign, Eye } from "lucide-react";
import { useData } from "@/hooks/use-data";
import { MetricCardSkeleton, TransactionListSkeleton } from "@/components/skeletons";
import Link from "next/link";

export default function DashboardPage() {
  const userKey = useUserKey();

  // New data hooks
  const { data: stats, isLoading: isStatsLoading } = useData<any>("analytics:dashboard" as any, { userKey } as any);
  const { data: activities, isLoading: isActivitiesLoading } = useData<any[]>("activities:list" as any, { userKey } as any);

  const [metricType, setMetricType] = useState<"balance" | "spending" | "portfolio" | "investment" | null>(null);
  const [activeChart, setActiveChart] = useState<"spending" | "income" | "transfer" | "balance">("spending");

  const balance = stats?.totalBalance ?? 0;
  const monthExpense = stats?.monthExpense ?? 0;
  const monthIncome = stats?.monthIncome ?? 0;
  const monthTransferVolume = stats?.monthTransferVolume ?? 0;
  const trends = stats?.trends ?? { balance: 0, income: 0, expense: 0, net: 0 };
  const spendingByCategory = stats?.spendingByCategory ?? [];
  const spendingHistory = stats?.spendingHistory ?? [];
  const incomeHistory = stats?.incomeHistory ?? [];
  const transferHistory = stats?.transferHistory ?? [];

  // Fetch Wallet History for the "Balance" chart
  const { data: balanceHistory } = useData<any[]>(
    "analytics:walletHistory" as any,
    { userKey, period: "daily", walletId: "all" } as any
  );

  const formatTrend = (val: number) => {
    const abs = Math.abs(val).toFixed(1);
    return `${val >= 0 ? "+" : "-"}${abs}% then last month`;
  };

  const getCategoryStyle = (label: string) => {
    const normalized = label.toLowerCase();
    if (normalized.includes("rent") || normalized.includes("house")) return { icon: Home, color: "bg-indigo-100 text-indigo-600" };
    if (normalized.includes("mobile") || normalized.includes("phone")) return { icon: Smartphone, color: "bg-yellow-100 text-yellow-600" };
    if (normalized.includes("electric") || normalized.includes("power")) return { icon: Zap, color: "bg-blue-100 text-blue-600" };
    if (normalized.includes("internet") || normalized.includes("wifi")) return { icon: Wifi, color: "bg-emerald-100 text-emerald-600" };
    if (normalized.includes("food") || normalized.includes("dining")) return { icon: Utensils, color: "bg-orange-100 text-orange-600" };
    if (normalized.includes("want") || normalized.includes("shopping")) return { icon: ShoppingBag, color: "bg-pink-100 text-pink-600" };
    if (normalized.includes("gas") || normalized.includes("fuel")) return { icon: Fuel, color: "bg-purple-100 text-purple-600" };
    return { icon: CircleDollarSign, color: "bg-gray-100 text-gray-600" };
  };

  return (
    <DashboardShell>
      <MetricExplainer
        isOpen={metricType !== null}
        onClose={() => setMetricType(null)}
        type={metricType}
      />
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
        {/* Left Column (Metrics + Recent Transactions) */}
        <div className="col-span-1 md:col-span-12 xl:col-span-5 flex flex-col gap-6 md:gap-8">
          {/* 4 Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isStatsLoading ? (
              <>
                <MetricCardSkeleton />
                <MetricCardSkeleton />
                <MetricCardSkeleton />
                <MetricCardSkeleton />
              </>
            ) : (
              <>
                <MetricCard
                  label="Balance"
                  value={`₱${balance.toLocaleString()}`}
                  subtext={formatTrend(trends.balance)}
                  trend={trends.balance >= 0 ? "up" : "down"}
                  colorVar="--card-orange"
                  onClick={() => setMetricType("balance")}
                />
                <MetricCard
                  label="Spending"
                  value={`₱${monthExpense.toLocaleString()}`}
                  subtext={formatTrend(trends.expense)}
                  trend={trends.expense >= 0 ? "up" : "down"}
                  colorVar="--card-green"
                  onClick={() => setMetricType("spending")}
                />
                <MetricCard
                  label="Portfolio"
                  value={`₱${(balance * 1.5).toLocaleString()}`} // Mocked portfolio
                  subtext={formatTrend(trends.net)} // Using Net Savings trend as proxy
                  trend={trends.net >= 0 ? "up" : "down"}
                  colorVar="--card-purple"
                  onClick={() => setMetricType("portfolio")}
                />
                <MetricCard
                  label="Investment"
                  value={`₱${(balance * 0.3).toLocaleString()}`} // Mocked investment
                  subtext={formatTrend(trends.income)} // Using Income trend as proxy
                  trend={trends.income >= 0 ? "up" : "down"}
                  colorVar="--card-blue"
                  onClick={() => setMetricType("investment")}
                />
              </>
            )}
          </div>

          {/* Recent Activity List */}
          <Card className="flex-1 border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <Link href="/activities" className="text-gray-400 hover:text-gray-600 transition-colors">
                <Eye className="h-5 w-5" />
              </Link>
            </CardHeader>
            <CardContent>
              {isActivitiesLoading ? (
                <TransactionListSkeleton />
              ) : (
                <ActivityList activities={activities?.slice(0, 4) ?? []} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Chart + Categories) */}
        <div className="col-span-1 md:col-span-12 xl:col-span-7 flex flex-col gap-6 md:gap-8">
          {/* Main Chart */}
          <div>
            <div className="mb-4 flex items-center gap-2 md:gap-4 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              <button
                onClick={() => setActiveChart("spending")}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeChart === "spending" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Spending
              </button>
              <button
                onClick={() => setActiveChart("income")}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeChart === "income" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                Income
              </button>
              <button
                onClick={() => setActiveChart("transfer")}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeChart === "transfer" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                }`}
              >
                Transfers
              </button>
              <button
                onClick={() => setActiveChart("balance")}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeChart === "balance" ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                }`}
              >
                Balance
              </button>
            </div>

            {activeChart === "spending" && <SpendingChart data={spendingHistory} total={monthExpense} />}
            {activeChart === "income" && <IncomeChart data={incomeHistory} total={monthIncome} />}
            {activeChart === "transfer" && <TransferChart data={transferHistory} total={monthTransferVolume} />}
            {activeChart === "balance" && <BalanceChart data={balanceHistory || []} />}
          </div>

          {/* Spending Categories Row */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Spending</h3>
              <button className="text-gray-400 hover:text-gray-600">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>
            {spendingByCategory.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {spendingByCategory.map((cat: { label: string, amount: number }) => {
                  const style = getCategoryStyle(cat.label);
                  return (
                    <div key={cat.label} className="rounded-2xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${style.color}`}>
                        <style.icon className="h-5 w-5" />
                      </div>
                      <div className="text-sm font-medium text-gray-500 truncate" title={cat.label}>{cat.label}</div>
                      <div className="font-bold text-gray-900">₱{cat.amount.toLocaleString()}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-2xl bg-white p-8 shadow-sm text-gray-500">
                No spending data for this month
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
