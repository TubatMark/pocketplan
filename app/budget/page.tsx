"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useData } from "@/hooks/use-data";
import { useAction as useActionHook } from "@/hooks/use-action";
import { useUserKey } from "@/lib/session";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Copy,
  Save,
  Sparkles,
  Wallet,
  PiggyBank,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Bucket = "expense" | "savings" | "others";

interface Category {
  id?: string;
  bucket: Bucket;
  name: string;
  amount: number;
}

const BUCKETS: { key: Bucket; label: string; sub: string; tone: string; ring: string; chip: string; Icon: any }[] = [
  {
    key: "expense",
    label: "Expense",
    sub: "Day-to-day spending",
    tone: "from-rose-50 to-white",
    ring: "ring-rose-100",
    chip: "bg-rose-100 text-rose-700",
    Icon: Wallet,
  },
  {
    key: "savings",
    label: "Savings",
    sub: "Money you set aside",
    tone: "from-emerald-50 to-white",
    ring: "ring-emerald-100",
    chip: "bg-emerald-100 text-emerald-700",
    Icon: PiggyBank,
  },
  {
    key: "others",
    label: "Others",
    sub: "Misc and ad-hoc",
    tone: "from-amber-50 to-white",
    ring: "ring-amber-100",
    chip: "bg-amber-100 text-amber-700",
    Icon: Coins,
  },
];

function currentYearMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function shiftMonth(ym: string, delta: number) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function formatMonth(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
}
function peso(n: number) {
  return `₱${Math.round(n).toLocaleString()}`;
}

export default function BudgetPage() {
  const userKey = useUserKey();
  const [yearMonth, setYearMonth] = useState(currentYearMonth());

  const { data: budget, refresh: refreshBudget } = useData<any>(
    "budgets:get" as any,
    { userKey, yearMonth } as any
  );
  const { data: history } = useData<any[]>("budgets:list" as any, { userKey } as any);

  const { mutate: saveBudget, isLoading: isSaving } = useActionHook(
    "budgets:save" as any,
    {
      onSuccess: () => refreshBudget(),
    }
  );
  const { mutate: copyPrev, isLoading: isCopying } = useActionHook(
    "budgets:copyFromPrevious" as any,
    {
      onSuccess: () => refreshBudget(),
    }
  );

  const [income, setIncome] = useState(0);
  const [pct, setPct] = useState({ expense: 60, savings: 30, others: 10 });
  const [categories, setCategories] = useState<Category[]>([]);

  // Hydrate from server
  useEffect(() => {
    if (budget) {
      setIncome(budget.income ?? 0);
      setPct({
        expense: budget.expense_pct ?? 60,
        savings: budget.savings_pct ?? 30,
        others: budget.others_pct ?? 10,
      });
      setCategories(
        (budget.categories ?? []).map((c: any) => ({
          id: c._id,
          bucket: c.bucket,
          name: c.name,
          amount: c.amount,
        }))
      );
    } else if (budget === null) {
      // No budget for this month → reset to defaults
      setIncome(0);
      setPct({ expense: 60, savings: 30, others: 10 });
      setCategories([]);
    }
  }, [budget]);

  const pctTotal = pct.expense + pct.savings + pct.others;
  const pctValid = Math.abs(pctTotal - 100) < 0.5;

  const bucketBudget = useMemo(() => {
    return {
      expense: (income * pct.expense) / 100,
      savings: (income * pct.savings) / 100,
      others: (income * pct.others) / 100,
    };
  }, [income, pct]);

  const allocatedByBucket = useMemo(() => {
    const sum: Record<Bucket, number> = { expense: 0, savings: 0, others: 0 };
    for (const c of categories) sum[c.bucket] += Number(c.amount) || 0;
    return sum;
  }, [categories]);

  const updatePct = (bucket: Bucket, value: number) => {
    setPct((prev) => ({ ...prev, [bucket]: Math.max(0, Math.min(100, value)) }));
  };

  const addCategory = (bucket: Bucket) => {
    setCategories((prev) => [...prev, { bucket, name: "", amount: 0 }]);
  };

  const updateCategory = (index: number, patch: Partial<Category>) => {
    setCategories((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };

  const removeCategory = (index: number) => {
    setCategories((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!pctValid) return;
    const cleaned = categories
      .filter((c) => c.name.trim().length > 0)
      .map((c) => ({ bucket: c.bucket, name: c.name.trim(), amount: Number(c.amount) || 0 }));
    try {
      await saveBudget({
        userKey,
        yearMonth,
        income: Number(income) || 0,
        expense_pct: pct.expense,
        savings_pct: pct.savings,
        others_pct: pct.others,
        categories: cleaned,
      });
    } catch (err: any) {
      alert(err.message || "Failed to save budget");
    }
  };

  const handleCopyPrev = async () => {
    try {
      await copyPrev({ userKey, yearMonth });
    } catch (err: any) {
      alert(err.message || "No previous month budget to copy");
    }
  };

  const applyPreset = (e: number, s: number, o: number) => setPct({ expense: e, savings: s, others: o });

  return (
    <DashboardShell>
      <div className="space-y-8 pb-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.16em] text-gray-400">
              Monthly budget
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
              Plan your money for {formatMonth(yearMonth)}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Set your income, divide it into buckets, then break each bucket into the categories you spend on.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setYearMonth(shiftMonth(yearMonth, -1))}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-100 hover:bg-gray-50"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="rounded-full bg-white px-4 py-2 text-sm font-medium shadow-sm ring-1 ring-gray-100">
              {formatMonth(yearMonth)}
            </div>
            <button
              onClick={() => setYearMonth(shiftMonth(yearMonth, +1))}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-100 hover:bg-gray-50"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Income + allocation */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Income card */}
          <div className="lg:col-span-4">
            <div className="rounded-3xl bg-gradient-to-br from-gray-900 to-gray-700 p-6 text-white shadow-sm">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/70">
                <Sparkles className="h-3.5 w-3.5" />
                Step 1
              </div>
              <div className="mt-1 text-base font-semibold">Monthly income</div>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-3xl font-bold opacity-90">₱</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={income || ""}
                  onChange={(e) => setIncome(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full bg-transparent text-5xl font-bold tracking-tight text-white placeholder-white/30 focus:outline-none"
                />
              </div>
              <p className="mt-3 text-xs text-white/60">
                What you expect to take home this month.
              </p>
            </div>
          </div>

          {/* Allocation card */}
          <div className="lg:col-span-8">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Step 2
                  </div>
                  <div className="text-base font-semibold text-gray-900">Split it into buckets</div>
                  <p className="mt-1 text-xs text-gray-500">
                    Drag the percentages until they total 100%.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <PresetChip onClick={() => applyPreset(50, 30, 20)} label="50/30/20" />
                  <PresetChip onClick={() => applyPreset(60, 30, 10)} label="60/30/10" />
                  <PresetChip onClick={() => applyPreset(70, 20, 10)} label="70/20/10" />
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {BUCKETS.map((b) => (
                  <BucketSlider
                    key={b.key}
                    label={b.label}
                    chip={b.chip}
                    Icon={b.Icon}
                    pct={pct[b.key]}
                    amount={bucketBudget[b.key]}
                    income={income}
                    onPctChange={(v) => updatePct(b.key, v)}
                    onAmountChange={(amt) => {
                      if (income <= 0) return;
                      const next = Math.max(0, Math.min(100, (amt / income) * 100));
                      updatePct(b.key, Math.round(next * 100) / 100);
                    }}
                  />
                ))}
              </div>

              <div
                className={cn(
                  "mt-5 flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium",
                  pctValid
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                )}
              >
                <span>{pctValid ? "Looks good" : "Adjust until total reaches 100%"}</span>
                <span className="tabular-nums">{pctTotal.toFixed(0)}% / 100%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bucket category lists */}
        <div className="grid gap-5 lg:grid-cols-3">
          {BUCKETS.map((b) => {
            const allocated = allocatedByBucket[b.key];
            const remaining = bucketBudget[b.key] - allocated;
            const over = remaining < -0.5;
            return (
              <div
                key={b.key}
                className={cn(
                  "rounded-3xl bg-gradient-to-b p-5 shadow-sm ring-1",
                  b.tone,
                  b.ring
                )}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", b.chip)}>
                      <b.Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{b.label}</div>
                      <div className="text-[11px] text-gray-500">{b.sub}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider text-gray-400">Bucket</div>
                    <div className="text-base font-bold tabular-nums text-gray-900">
                      {peso(bucketBudget[b.key])}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {categories
                    .map((c, idx) => ({ c, idx }))
                    .filter(({ c }) => c.bucket === b.key)
                    .map(({ c, idx }) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 rounded-xl bg-white px-2.5 py-2 shadow-[0_1px_0_rgba(0,0,0,0.03)] ring-1 ring-gray-100"
                      >
                        <Input
                          value={c.name}
                          onChange={(e) => updateCategory(idx, { name: e.target.value })}
                          placeholder="Category"
                          className="h-9 border-none px-2 text-sm shadow-none focus-visible:ring-1"
                        />
                        <div className="flex shrink-0 items-center gap-1 rounded-lg bg-gray-50 px-2">
                          <span className="text-xs text-gray-400">₱</span>
                          <Input
                            type="number"
                            inputMode="decimal"
                            value={c.amount || ""}
                            onChange={(e) =>
                              updateCategory(idx, { amount: Number(e.target.value) || 0 })
                            }
                            placeholder="0"
                            className="h-9 w-24 border-none bg-transparent px-0 text-right text-sm font-medium tabular-nums shadow-none focus-visible:ring-0"
                          />
                        </div>
                        <button
                          onClick={() => removeCategory(idx)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-300 hover:bg-rose-50 hover:text-rose-500"
                          aria-label="Remove category"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}

                  <button
                    onClick={() => addCategory(b.key)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-200 px-3 py-2.5 text-xs font-medium text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-900"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add category
                  </button>
                </div>

                <div
                  className={cn(
                    "mt-4 flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold",
                    over
                      ? "bg-rose-100 text-rose-700"
                      : "bg-white text-gray-700 ring-1 ring-gray-100"
                  )}
                >
                  <span>{over ? "Over allocated" : "Remaining"}</span>
                  <span className="tabular-nums">
                    {remaining < 0 ? `-${peso(Math.abs(remaining))}` : peso(remaining)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="sticky bottom-20 z-10 flex flex-col gap-3 rounded-3xl bg-white/90 p-4 shadow-lg ring-1 ring-gray-100 backdrop-blur md:bottom-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">Income:</span>{" "}
            <span className="tabular-nums">{peso(income)}</span>
            <span className="px-2 text-gray-300">·</span>
            <span className="font-semibold text-gray-900">Total budgeted:</span>{" "}
            <span className="tabular-nums">
              {peso(allocatedByBucket.expense + allocatedByBucket.savings + allocatedByBucket.others)}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCopyPrev}
              disabled={isCopying}
              className="gap-1.5"
            >
              <Copy className="h-4 w-4" />
              {isCopying ? "Copying..." : "Copy from last month"}
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !pctValid} className="gap-1.5">
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : budget ? "Update budget" : "Save budget"}
            </Button>
          </div>
        </div>

        {/* History */}
        <div>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-gray-400">History</div>
              <h2 className="text-base font-semibold text-gray-900">Past months</h2>
            </div>
          </div>
          {(!history || history.length === 0) && (
            <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400">
              No saved budgets yet. Your past months will show up here once you save one.
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {history?.map((b: any) => (
              <button
                key={b._id}
                onClick={() => setYearMonth(b.year_month)}
                className={cn(
                  "rounded-2xl bg-white p-4 text-left shadow-sm ring-1 transition-all hover:-translate-y-0.5 hover:shadow-md",
                  b.year_month === yearMonth ? "ring-gray-900" : "ring-gray-100"
                )}
              >
                <div className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                  {formatMonth(b.year_month)}
                </div>
                <div className="mt-1 text-xl font-bold tabular-nums text-gray-900">
                  {peso(b.income)}
                </div>
                <div className="mt-2 flex gap-1.5 text-[11px] font-medium">
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-rose-700">
                    E {b.expense_pct}%
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">
                    S {b.savings_pct}%
                  </span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">
                    O {b.others_pct}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function PresetChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full bg-gray-50 px-3 py-1.5 text-[11px] font-semibold text-gray-600 transition-colors hover:bg-gray-100"
    >
      {label}
    </button>
  );
}

function BucketSlider({
  label,
  chip,
  Icon,
  pct,
  amount,
  income,
  onPctChange,
  onAmountChange,
}: {
  label: string;
  chip: string;
  Icon: any;
  pct: number;
  amount: number;
  income: number;
  onPctChange: (v: number) => void;
  onAmountChange: (v: number) => void;
}) {
  // Local input state — keeps free-typing fluid even though the canonical value
  // upstream is a percentage. We sync from props only when the field is not focused,
  // so user keystrokes are never clobbered.
  const [pctInput, setPctInput] = useState<string>("");
  const [amountInput, setAmountInput] = useState<string>("");
  const [focused, setFocused] = useState<"pct" | "amount" | null>(null);

  useEffect(() => {
    if (focused !== "pct") {
      setPctInput(Number.isFinite(pct) ? String(Math.round(pct * 100) / 100) : "0");
    }
  }, [pct, focused]);

  useEffect(() => {
    if (focused !== "amount") {
      setAmountInput(amount > 0 ? String(Math.round(amount)) : "");
    }
  }, [amount, focused]);

  return (
    <div className="rounded-2xl bg-gray-50 p-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", chip)}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-semibold text-gray-800">{label}</span>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-white px-2 py-1 ring-1 ring-gray-100">
          <input
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={pctInput}
            onFocus={() => setFocused("pct")}
            onBlur={() => setFocused(null)}
            onChange={(e) => {
              setPctInput(e.target.value);
              const n = Number(e.target.value);
              if (Number.isFinite(n)) onPctChange(n);
            }}
            className="w-12 bg-transparent text-right text-sm font-bold tabular-nums focus:outline-none"
          />
          <span className="text-xs text-gray-400">%</span>
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        step={0.5}
        value={pct}
        onChange={(e) => onPctChange(Number(e.target.value))}
        className="mt-3 w-full accent-gray-900"
      />

      <div className="mt-2 flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-gray-100">
        <span className="text-xs text-gray-400">₱</span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step={1}
          value={amountInput}
          onFocus={() => setFocused("amount")}
          onBlur={() => setFocused(null)}
          onChange={(e) => {
            setAmountInput(e.target.value);
            const n = Number(e.target.value);
            if (Number.isFinite(n)) onAmountChange(n);
          }}
          placeholder={income <= 0 ? "set income first" : "0"}
          className="w-full bg-transparent text-right text-base font-bold tabular-nums focus:outline-none placeholder:text-gray-300"
          aria-label={`${label} amount`}
        />
      </div>
    </div>
  );
}
