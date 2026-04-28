"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { useUserKey } from "@/lib/session";
import { useData } from "@/hooks/use-data";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Wallet,
  PiggyBank,
  Coins,
  TrendingDown,
  TrendingUp,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  Sparkles,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

function ymOf(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function peso(n: number) {
  return `₱${Math.round(n).toLocaleString()}`;
}
function pesoExact(n: number) {
  return `₱${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const BUCKET_META: Record<string, { label: string; chip: string; bar: string; Icon: any }> = {
  expense: { label: "Expense", chip: "bg-rose-100 text-rose-700", bar: "bg-rose-500", Icon: Wallet },
  savings: { label: "Savings", chip: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-500", Icon: PiggyBank },
  others: { label: "Others", chip: "bg-amber-100 text-amber-700", bar: "bg-amber-500", Icon: Coins },
};

export default function DashboardPage() {
  const userKey = useUserKey();
  const [cursor, setCursor] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());

  const yearMonth = ymOf(cursor);

  const { data: stats } = useData<any>("analytics:dashboard" as any, { userKey } as any);
  const { data: cal } = useData<any>(
    "analytics:monthCalendar" as any,
    { userKey, yearMonth } as any
  );
  const { data: txs } = useData<any[]>("transactions:list" as any, { userKey } as any);

  const wallets: any[] = stats?.wallets ?? [];
  const recent: any[] = stats?.recentTransactions ?? [];

  const dayTxs = useMemo(() => {
    if (!selectedDay || !txs) return [];
    return txs
      .filter((t: any) => {
        const d = new Date(t.created_at);
        return (
          d.getFullYear() === selectedDay.getFullYear() &&
          d.getMonth() === selectedDay.getMonth() &&
          d.getDate() === selectedDay.getDate()
        );
      })
      .sort((a, b) => b.created_at - a.created_at);
  }, [selectedDay, txs]);

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Top header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.16em] text-gray-400">
              Today, {format(new Date(), "MMM d, yyyy")}
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
              Your money at a glance
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/transactions"
              className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-800"
            >
              <Plus className="h-4 w-4" />
              Add transaction
            </Link>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-12">
          {/* KPI rail */}
          <aside className="space-y-4 lg:col-span-4 xl:col-span-3">
            <BalanceCard balance={stats?.totalBalance ?? 0} wallets={wallets} />

            <div className="grid grid-cols-3 gap-3">
              <MiniStat
                label="Income"
                value={peso(stats?.monthIncome ?? 0)}
                trend="up"
                accent="emerald"
              />
              <MiniStat
                label="Spent"
                value={peso(stats?.monthExpense ?? 0)}
                trend="down"
                accent="rose"
              />
              <MiniStat
                label="Today"
                value={peso(stats?.todayExpense ?? 0)}
                trend="flat"
                accent="gray"
              />
            </div>

            {/* Per-bucket progress */}
            <Card title="Budget progress" subtitle={formatYM(yearMonth)}>
              {!stats?.hasBudget ? (
                <Link
                  href="/budget"
                  className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Set up this month
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Link>
              ) : (
                <div className="space-y-3.5">
                  {(stats?.buckets ?? []).map((b: any) => (
                    <BucketBar key={b.key} bucketKey={b.key} budget={b.budget} spent={b.spent} pct={b.pct} />
                  ))}
                </div>
              )}
            </Card>

            <Card title="Top categories" subtitle="this month">
              {(stats?.topCategories ?? []).length === 0 ? (
                <Empty text="Log a few transactions to see your top categories." />
              ) : (
                <div className="space-y-2.5">
                  {(stats?.topCategories ?? []).map((c: any) => (
                    <div key={c.name} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{c.name}</span>
                      <span className="font-semibold tabular-nums text-gray-900">{peso(c.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title="Debts" linkHref="/debts" linkLabel="Manage">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-rose-50 p-3">
                  <div className="text-[11px] font-medium text-rose-600">You owe</div>
                  <div className="mt-0.5 text-base font-bold text-rose-700 tabular-nums">
                    {peso(stats?.outstandingDebt ?? 0)}
                  </div>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3">
                  <div className="text-[11px] font-medium text-emerald-600">Owes you</div>
                  <div className="mt-0.5 text-base font-bold text-emerald-700 tabular-nums">
                    {peso(stats?.receivableDebt ?? 0)}
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Recent activity" linkHref="/transactions" linkLabel="See all">
              {recent.length === 0 ? (
                <Empty text="No recent transactions." />
              ) : (
                <div className="space-y-2.5">
                  {recent.slice(0, 5).map((t: any) => {
                    const w = wallets.find((w: any) => w._id === t.wallet_id);
                    return (
                      <div key={t._id} className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <TxIcon type={t.type} />
                          <div className="min-w-0">
                            <div className="truncate text-xs font-semibold text-gray-900">
                              {t.category || "Transaction"}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {format(new Date(t.created_at), "MMM d")} · {w?.name ?? ""}
                            </div>
                          </div>
                        </div>
                        <div className={cn("text-xs font-bold tabular-nums", txAmountClass(t.type))}>
                          {txPrefix(t.type)}
                          {peso(t.amount)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </aside>

          {/* Calendar */}
          <main className="space-y-4 lg:col-span-8 xl:col-span-9">
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="text-lg font-bold tracking-tight text-gray-900">
                    {format(cursor, "MMMM yyyy")}
                  </div>
                  <button
                    onClick={() =>
                      setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100"
                    aria-label="Next month"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Legend dot="bg-emerald-500" label="Income" />
                  <Legend dot="bg-rose-500" label="Spend" />
                  <Legend dot="bg-blue-500" label="Transfer" />
                  <button
                    onClick={() => {
                      const today = new Date();
                      setCursor(today);
                      setSelectedDay(today);
                    }}
                    className="ml-1 rounded-full bg-gray-50 px-3 py-1.5 text-[11px] font-semibold text-gray-700 hover:bg-gray-100"
                  >
                    Today
                  </button>
                </div>
              </div>
              <CalendarMonth
                cursor={cursor}
                summaries={cal?.days ?? {}}
                selected={selectedDay}
                onSelect={setSelectedDay}
              />
            </div>

            {/* Day detail */}
            {selectedDay && (
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wider text-gray-400">
                      {format(selectedDay, "EEEE")}
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-gray-900">
                      {format(selectedDay, "MMMM d")}
                    </h2>
                  </div>
                  <Link
                    href="/transactions"
                    className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-gray-800"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Log
                  </Link>
                </div>

                <DayTotals txs={dayTxs} />

                {dayTxs.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-400">
                    No transactions on this day.
                  </div>
                ) : (
                  <div className="mt-4 divide-y divide-gray-50">
                    {dayTxs.map((t: any) => {
                      const w = wallets.find((w: any) => w._id === t.wallet_id);
                      const fromW = wallets.find((w: any) => w._id === t.transfer_from_wallet_id);
                      const toW = wallets.find((w: any) => w._id === t.transfer_to_wallet_id);
                      return (
                        <div key={t._id} className="flex items-center gap-3 py-3">
                          <TxIcon type={t.type} large />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-gray-900">
                              {t.category || "Transaction"}
                            </div>
                            <div className="truncate text-xs text-gray-400">
                              {t.type === "transfer"
                                ? `${fromW?.name ?? "Wallet"} → ${toW?.name ?? "Wallet"}`
                                : w?.name ?? ""}
                              {t.notes ? ` · ${t.notes}` : ""}
                            </div>
                          </div>
                          <div className={cn("text-sm font-bold tabular-nums", txAmountClass(t.type))}>
                            {txPrefix(t.type)}
                            {peso(t.amount)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </DashboardShell>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function Card({
  title,
  subtitle,
  linkHref,
  linkLabel,
  children,
}: {
  title: string;
  subtitle?: string;
  linkHref?: string;
  linkLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            {title}
          </div>
          {subtitle && (
            <div className="text-xs font-medium text-gray-700">{subtitle}</div>
          )}
        </div>
        {linkHref && (
          <Link
            href={linkHref}
            className="text-[11px] font-medium text-gray-500 hover:text-gray-900"
          >
            {linkLabel ?? "View"}
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function BalanceCard({ balance, wallets }: { balance: number; wallets: any[] }) {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-gray-900 to-gray-700 p-5 text-white shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
        Total balance
      </div>
      <div className="mt-1 text-3xl font-bold tabular-nums">{pesoExact(balance)}</div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {wallets.slice(0, 4).map((w: any) => (
          <span
            key={w._id}
            className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-white/90"
          >
            {w.name} · {peso(w.balance)}
          </span>
        ))}
        {wallets.length > 4 && (
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-white/70">
            +{wallets.length - 4} more
          </span>
        )}
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  trend,
  accent,
}: {
  label: string;
  value: string;
  trend: "up" | "down" | "flat";
  accent: "rose" | "emerald" | "gray";
}) {
  const accents: Record<string, string> = {
    rose: "text-rose-600",
    emerald: "text-emerald-600",
    gray: "text-gray-700",
  };
  const Icon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Eye;
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-gray-100">
      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        <Icon className={cn("h-3 w-3", accents[accent])} />
        {label}
      </div>
      <div className="mt-1 text-base font-bold tabular-nums text-gray-900">{value}</div>
    </div>
  );
}

function BucketBar({
  bucketKey,
  budget,
  spent,
  pct,
}: {
  bucketKey: string;
  budget: number;
  spent: number;
  pct: number;
}) {
  const meta = BUCKET_META[bucketKey] ?? BUCKET_META.expense;
  const Icon = meta.Icon;
  const over = budget > 0 && spent > budget;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className={cn("flex h-5 w-5 items-center justify-center rounded-md", meta.chip)}>
            <Icon className="h-3 w-3" />
          </span>
          <span className="font-semibold text-gray-800">{meta.label}</span>
        </div>
        <div className="font-medium tabular-nums text-gray-600">
          <span className={over ? "text-rose-600 font-bold" : "text-gray-900"}>{peso(spent)}</span>
          <span className="text-gray-300"> / </span>
          <span>{peso(budget)}</span>
        </div>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className={cn("h-full rounded-full transition-all", over ? "bg-rose-500" : meta.bar)}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}

function CalendarMonth({
  cursor,
  summaries,
  selected,
  onSelect,
}: {
  cursor: Date;
  summaries: Record<string, any>;
  selected: Date | null;
  onSelect: (d: Date) => void;
}) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const totalDays = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay.getDay();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const today = new Date();
  const isToday = (d: Date) =>
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  const isSelected = (d: Date) =>
    selected !== null &&
    d.getFullYear() === selected.getFullYear() &&
    d.getMonth() === selected.getMonth() &&
    d.getDate() === selected.getDate();

  const HEAD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div>
      <div className="mb-1.5 grid grid-cols-7 gap-1.5">
        {HEAD.map((d) => (
          <div
            key={d}
            className="px-1 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((d, i) => {
          if (!d) {
            return <div key={`e-${i}`} className="min-h-[88px] rounded-xl bg-gray-50/40" />;
          }
          const k = dayKey(d);
          const s = summaries[k];
          const td = isToday(d);
          const sel = isSelected(d);
          return (
            <button
              key={k}
              onClick={() => onSelect(d)}
              className={cn(
                "group min-h-[88px] rounded-xl p-2 text-left transition-all",
                sel
                  ? "bg-gray-900 text-white shadow-md"
                  : td
                    ? "bg-amber-50 ring-1 ring-amber-200"
                    : "bg-white ring-1 ring-gray-100 hover:ring-gray-300 hover:shadow-sm"
              )}
            >
              <div className={cn(
                "flex items-baseline justify-between text-xs font-bold",
                sel ? "text-white" : td ? "text-amber-700" : "text-gray-900"
              )}>
                <span>{d.getDate()}</span>
                {td && !sel && <span className="text-[9px] font-medium uppercase">today</span>}
              </div>
              {s && (
                <div className="mt-1 space-y-0.5">
                  {s.income > 0 && (
                    <div
                      className={cn(
                        "truncate rounded px-1 py-0.5 text-[10px] font-medium",
                        sel ? "bg-white/15 text-emerald-200" : "bg-emerald-50 text-emerald-700"
                      )}
                    >
                      +{peso(s.income)}
                    </div>
                  )}
                  {s.expense > 0 && (
                    <div
                      className={cn(
                        "truncate rounded px-1 py-0.5 text-[10px] font-medium",
                        sel ? "bg-white/15 text-rose-200" : "bg-rose-50 text-rose-700"
                      )}
                    >
                      -{peso(s.expense)}
                    </div>
                  )}
                  {s.transfer > 0 && (
                    <div
                      className={cn(
                        "truncate rounded px-1 py-0.5 text-[10px] font-medium",
                        sel ? "bg-white/15 text-blue-200" : "bg-blue-50 text-blue-700"
                      )}
                    >
                      ↔{peso(s.transfer)}
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DayTotals({ txs }: { txs: any[] }) {
  const income = txs.filter((t) => t.type === "income").reduce((a, t) => a + t.amount, 0);
  const expense = txs
    .filter((t) => t.type === "expense" || t.type === "debt_payment")
    .reduce((a, t) => a + t.amount, 0);
  const transfer = txs.filter((t) => t.type === "transfer").reduce((a, t) => a + t.amount, 0);
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="rounded-2xl bg-emerald-50 p-3 text-center">
        <div className="text-[10px] font-medium text-emerald-600">Income</div>
        <div className="text-base font-bold text-emerald-700 tabular-nums">{peso(income)}</div>
      </div>
      <div className="rounded-2xl bg-rose-50 p-3 text-center">
        <div className="text-[10px] font-medium text-rose-600">Spent</div>
        <div className="text-base font-bold text-rose-700 tabular-nums">{peso(expense)}</div>
      </div>
      <div className="rounded-2xl bg-blue-50 p-3 text-center">
        <div className="text-[10px] font-medium text-blue-600">Transfer</div>
        <div className="text-base font-bold text-blue-700 tabular-nums">{peso(transfer)}</div>
      </div>
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="flex items-center gap-1 text-gray-500">
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {label}
    </span>
  );
}

function TxIcon({ type, large }: { type: string; large?: boolean }) {
  let bg = "bg-rose-50";
  let color = "text-rose-600";
  let Icon = ArrowDownRight;
  if (type === "income") {
    bg = "bg-emerald-50";
    color = "text-emerald-600";
    Icon = ArrowUpRight;
  } else if (type === "transfer") {
    bg = "bg-blue-50";
    color = "text-blue-600";
    Icon = ArrowLeftRight;
  } else if (type === "debt_payment") {
    bg = "bg-violet-50";
    color = "text-violet-600";
    Icon = CreditCard;
  }
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl",
        bg,
        large ? "h-10 w-10" : "h-8 w-8"
      )}
    >
      <Icon className={cn(color, large ? "h-4 w-4" : "h-3.5 w-3.5")} />
    </div>
  );
}

function txAmountClass(type: string) {
  if (type === "income") return "text-emerald-600";
  if (type === "transfer") return "text-blue-600";
  if (type === "debt_payment") return "text-violet-600";
  return "text-rose-600";
}

function txPrefix(type: string) {
  if (type === "income") return "+";
  if (type === "transfer") return "";
  return "-";
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl bg-gray-50 px-3 py-4 text-center text-xs text-gray-500">{text}</div>
  );
}

function formatYM(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
}
