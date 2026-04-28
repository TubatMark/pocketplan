"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useData } from "@/hooks/use-data";
import { useAction as useActionHook } from "@/hooks/use-action";
import { useUserKey } from "@/lib/session";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  CreditCard,
  Pencil,
  Search,
  Trash2,
  X,
  Plus,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";

type Mode = "spend" | "earn" | "move";
type Bucket = "expense" | "savings" | "others";

const ITEMS_PER_PAGE = 12;

function ymOf(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function peso(n: number) {
  return `₱${Math.round(n).toLocaleString()}`;
}

const BUCKET_LABEL: Record<Bucket, string> = {
  expense: "Expense",
  savings: "Savings",
  others: "Others",
};

export default function TransactionsPage() {
  const userKey = useUserKey();

  const { data: wallets } = useData<any[]>("wallets:list" as any, { userKey } as any);
  const { data: txs, refresh: refreshTxs } = useData<any[]>(
    "transactions:list" as any,
    { userKey } as any
  );
  const { data: budget } = useData<any>(
    "budgets:get" as any,
    { userKey, yearMonth: ymOf(new Date()) } as any
  );

  const { mutate: logTx, isLoading: isLogging } = useActionHook(
    "transactions:log" as any,
    { onSuccess: () => refreshTxs() }
  );
  const { mutate: updateTx, isLoading: isUpdating } = useActionHook(
    "transactions:update" as any,
    { onSuccess: () => { refreshTxs(); setEditing(null); } }
  );
  const { mutate: deleteTx, isLoading: isDeleting } = useActionHook(
    "transactions:remove" as any,
    { onSuccess: () => refreshTxs() }
  );

  const [mode, setMode] = useState<Mode>("spend");
  const [walletId, setWalletId] = useState<string>("");
  const [fromWalletId, setFromWalletId] = useState<string>("");
  const [toWalletId, setToWalletId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [bucket, setBucket] = useState<Bucket>("expense");
  const [customCategory, setCustomCategory] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [editing, setEditing] = useState<any>(null);

  const categories: any[] = budget?.categories ?? [];

  // When budget changes, default the selected category
  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0]._id);
      setBucket(categories[0].bucket);
    }
  }, [categories, categoryId]);

  // Sync bucket with selected category
  useEffect(() => {
    const c = categories.find((c) => c._id === categoryId);
    if (c) setBucket(c.bucket);
  }, [categoryId, categories]);

  const resetForm = () => {
    setAmount(0);
    setNotes("");
    setCustomCategory("");
  };

  const handleSubmit = async () => {
    if (amount <= 0) return;
    try {
      if (mode === "earn") {
        if (!walletId) return alert("Pick a wallet");
        await logTx({
          userKey,
          type: "income",
          amount,
          category: customCategory.trim() || "Income",
          wallet_id: walletId as any,
          notes,
        });
      } else if (mode === "move") {
        if (!fromWalletId || !toWalletId) return alert("Pick both wallets");
        if (fromWalletId === toWalletId) return alert("Wallets must differ");
        await logTx({
          userKey,
          type: "transfer",
          amount,
          category: "Transfer",
          transfer_from_wallet_id: fromWalletId as any,
          transfer_to_wallet_id: toWalletId as any,
          notes,
        });
      } else {
        if (!walletId) return alert("Pick a wallet");
        const cat = categories.find((c) => c._id === categoryId);
        const finalCategory = cat?.name || customCategory.trim() || "Uncategorized";
        await logTx({
          userKey,
          type: "expense",
          amount,
          category: finalCategory,
          bucket: cat?.bucket ?? bucket,
          category_id: cat?._id as any,
          wallet_id: walletId as any,
          notes,
        });
      }
      resetForm();
    } catch (err: any) {
      alert(err.message || "Failed to log transaction");
    }
  };

  // Filters
  const [filterType, setFilterType] = useState<"all" | "income" | "expense" | "transfer" | "debt_payment">("all");
  const [filterRange, setFilterRange] = useState<"all" | "today" | "week" | "month">("all");
  const [filterWallet, setFilterWallet] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!txs) return [];
    let out = [...txs];
    if (filterType !== "all") out = out.filter((t) => t.type === filterType);
    if (filterWallet !== "all") {
      out = out.filter(
        (t) =>
          t.wallet_id === filterWallet ||
          t.transfer_from_wallet_id === filterWallet ||
          t.transfer_to_wallet_id === filterWallet
      );
    }
    if (filterRange !== "all") {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const sw = startOfWeek.getTime();
      const sm = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      out = out.filter((t) => {
        if (filterRange === "today") return t.created_at >= startOfDay;
        if (filterRange === "week") return t.created_at >= sw;
        if (filterRange === "month") return t.created_at >= sm;
        return true;
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(
        (t) =>
          (t.notes && t.notes.toLowerCase().includes(q)) ||
          (t.category && t.category.toLowerCase().includes(q)) ||
          String(t.amount).includes(q)
      );
    }
    return out.sort((a, b) => b.created_at - a.created_at);
  }, [txs, filterType, filterWallet, filterRange, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <DashboardShell>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.16em] text-gray-400">
            Transactions
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
            Log what you earn, spend, and move
          </h1>
        </div>

        {/* Logger */}
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100 md:p-6">
          <div className="mb-4 flex items-center gap-1 rounded-full bg-gray-100 p-1 w-fit">
            {(["spend", "earn", "move"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-colors",
                  mode === m
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                {m === "spend" ? "Spend" : m === "earn" ? "Earn" : "Move"}
              </button>
            ))}
          </div>

          {mode === "spend" && (
            <div className="grid gap-4 md:grid-cols-12">
              <div className="md:col-span-3">
                <Label className="text-xs">Wallet</Label>
                <Select value={walletId} onChange={(e) => setWalletId(e.target.value)} className="mt-1">
                  <option value="">Select wallet</option>
                  {wallets?.map((w: any) => (
                    <option key={w._id} value={w._id}>
                      {w.name} · {peso(w.balance)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="md:col-span-4">
                <Label className="text-xs">Category</Label>
                {categories.length > 0 ? (
                  <Select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="mt-1"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} · {BUCKET_LABEL[c.bucket as Bucket]}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <div className="mt-1 flex items-stretch gap-2">
                    <Select
                      value={bucket}
                      onChange={(e) => setBucket(e.target.value as Bucket)}
                      className="w-32"
                    >
                      <option value="expense">Expense</option>
                      <option value="savings">Savings</option>
                      <option value="others">Others</option>
                    </Select>
                    <Input
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Category name"
                    />
                  </div>
                )}
                {categories.length === 0 && (
                  <Link
                    href="/budget"
                    className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-gray-900"
                  >
                    <Sparkles className="h-3 w-3" />
                    Set up this month's budget for one-tap categories
                  </Link>
                )}
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">Amount</Label>
                <div className="mt-1 flex items-center rounded-md border border-input bg-background px-3 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                  <span className="text-sm text-gray-400">₱</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={amount || ""}
                    onChange={(e) => setAmount(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="h-10 w-full bg-transparent px-2 text-sm font-semibold tabular-nums focus:outline-none"
                  />
                </div>
              </div>
              <div className="md:col-span-3">
                <Label className="text-xs">Remarks</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="optional"
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {mode === "earn" && (
            <div className="grid gap-4 md:grid-cols-12">
              <div className="md:col-span-3">
                <Label className="text-xs">Wallet</Label>
                <Select value={walletId} onChange={(e) => setWalletId(e.target.value)} className="mt-1">
                  <option value="">Select wallet</option>
                  {wallets?.map((w: any) => (
                    <option key={w._id} value={w._id}>
                      {w.name} · {peso(w.balance)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="md:col-span-4">
                <Label className="text-xs">Source</Label>
                <Input
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Salary, freelance, gift..."
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">Amount</Label>
                <div className="mt-1 flex items-center rounded-md border border-input bg-background px-3 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                  <span className="text-sm text-gray-400">₱</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={amount || ""}
                    onChange={(e) => setAmount(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="h-10 w-full bg-transparent px-2 text-sm font-semibold tabular-nums focus:outline-none"
                  />
                </div>
              </div>
              <div className="md:col-span-3">
                <Label className="text-xs">Remarks</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="optional"
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {mode === "move" && (
            <div className="grid gap-4 md:grid-cols-12">
              <div className="md:col-span-3">
                <Label className="text-xs">From</Label>
                <Select value={fromWalletId} onChange={(e) => setFromWalletId(e.target.value)} className="mt-1">
                  <option value="">From wallet</option>
                  {wallets?.map((w: any) => (
                    <option key={w._id} value={w._id}>
                      {w.name} · {peso(w.balance)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="md:col-span-3">
                <Label className="text-xs">To</Label>
                <Select value={toWalletId} onChange={(e) => setToWalletId(e.target.value)} className="mt-1">
                  <option value="">To wallet</option>
                  {wallets?.map((w: any) => (
                    <option key={w._id} value={w._id}>
                      {w.name} · {peso(w.balance)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">Amount</Label>
                <div className="mt-1 flex items-center rounded-md border border-input bg-background px-3 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                  <span className="text-sm text-gray-400">₱</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={amount || ""}
                    onChange={(e) => setAmount(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="h-10 w-full bg-transparent px-2 text-sm font-semibold tabular-nums focus:outline-none"
                  />
                </div>
              </div>
              <div className="md:col-span-4">
                <Label className="text-xs">Remarks</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="optional"
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center justify-end">
            <Button onClick={handleSubmit} disabled={isLogging || amount <= 0} className="gap-1.5">
              <Plus className="h-4 w-4" />
              {isLogging ? "Saving..." : "Log transaction"}
            </Button>
          </div>
        </div>

        {/* Filters + list */}
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100 md:p-6">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent</h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search"
                  className="w-44 pl-9"
                />
              </div>
              <Select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="h-10 w-32">
                <option value="all">All types</option>
                <option value="income">Earn</option>
                <option value="expense">Spend</option>
                <option value="transfer">Move</option>
                <option value="debt_payment">Debt</option>
              </Select>
              <Select value={filterRange} onChange={(e) => setFilterRange(e.target.value as any)} className="h-10 w-32">
                <option value="all">All dates</option>
                <option value="today">Today</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
              </Select>
              <Select value={filterWallet} onChange={(e) => setFilterWallet(e.target.value)} className="h-10 w-36">
                <option value="all">All wallets</option>
                {wallets?.map((w: any) => (
                  <option key={w._id} value={w._id}>{w.name}</option>
                ))}
              </Select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-400">
              No transactions match.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {paged.map((t) => {
                const w = wallets?.find((w: any) => w._id === t.wallet_id);
                const fromW = wallets?.find((w: any) => w._id === t.transfer_from_wallet_id);
                const toW = wallets?.find((w: any) => w._id === t.transfer_to_wallet_id);
                return (
                  <div key={t._id} className="flex items-center gap-3 py-3">
                    <TxIcon type={t.type} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-gray-900">
                        {t.category || "Transaction"}
                      </div>
                      <div className="truncate text-xs text-gray-400">
                        {format(new Date(t.created_at), "MMM d, yyyy")} ·{" "}
                        {t.type === "transfer"
                          ? `${fromW?.name ?? "Wallet"} → ${toW?.name ?? "Wallet"}`
                          : w?.name ?? "Wallet"}
                        {t.notes ? ` · ${t.notes}` : ""}
                      </div>
                    </div>
                    <div className={cn("text-sm font-bold tabular-nums", txAmountClass(t.type))}>
                      {txPrefix(t.type)}
                      {peso(t.amount)}
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => setEditing(t)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                        aria-label="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Delete this transaction? Wallet balances will reverse.")) {
                            deleteTx({ userKey, transactionId: t._id });
                          }
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-rose-50 hover:text-rose-600"
                        aria-label="Delete"
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {filtered.length > ITEMS_PER_PAGE && (
            <div className="mt-4 flex items-center justify-between gap-2 border-t border-gray-50 pt-4">
              <div className="text-xs text-gray-400">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {editing && (
        <EditDialog
          tx={editing}
          isLoading={isUpdating}
          onClose={() => setEditing(null)}
          onSave={async (patch) => {
            try {
              await updateTx({
                userKey,
                transactionId: editing._id,
                ...patch,
              });
            } catch (err: any) {
              alert(err.message || "Failed to update");
            }
          }}
        />
      )}
    </DashboardShell>
  );
}

function EditDialog({
  tx,
  isLoading,
  onClose,
  onSave,
}: {
  tx: any;
  isLoading: boolean;
  onClose: () => void;
  onSave: (patch: { amount: number; category: string; notes: string }) => void;
}) {
  const [amount, setAmount] = useState(tx.amount);
  const [category, setCategory] = useState(tx.category ?? "");
  const [notes, setNotes] = useState(tx.notes ?? "");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Edit
            </div>
            <h2 className="text-lg font-bold text-gray-900">{tx.category || "Transaction"}</h2>
            <div className="text-xs text-gray-500">
              {format(new Date(tx.created_at), "MMM d, yyyy 'at' h:mm a")}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Amount</Label>
            <div className="mt-1 flex items-center rounded-md border border-input bg-background px-3 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <span className="text-sm text-gray-400">₱</span>
              <input
                type="number"
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                className="h-10 w-full bg-transparent px-2 text-sm font-semibold tabular-nums focus:outline-none"
              />
            </div>
          </div>
          {tx.type !== "transfer" && (
            <div>
              <Label className="text-xs">Category</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1" />
            </div>
          )}
          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1" />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={isLoading || amount <= 0}
            onClick={() => onSave({ amount, category, notes })}
          >
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function TxIcon({ type }: { type: string }) {
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
    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", bg)}>
      <Icon className={cn("h-4 w-4", color)} />
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
