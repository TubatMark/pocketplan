"use client";

import { format } from "date-fns";
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  category: string;
  wallet_id?: string;
  transfer_from_wallet_id?: string;
  transfer_to_wallet_id?: string;
  notes?: string;
  created_at: number;
}

interface Wallet {
  _id: string;
  name: string;
}

interface CalendarDayDetailProps {
  selectedDay: Date | null;
  transactions: Transaction[];
  wallets: Wallet[];
  onBack?: () => void;
  isMobile?: boolean;
}

function getWalletName(tx: Transaction, wallets: Wallet[]): string {
  if (tx.type === "transfer") {
    const from = wallets.find(w => w._id === tx.transfer_from_wallet_id)?.name ?? "Unknown";
    const to = wallets.find(w => w._id === tx.transfer_to_wallet_id)?.name ?? "Unknown";
    return `${from} → ${to}`;
  }
  return wallets.find(w => w._id === tx.wallet_id)?.name ?? "Wallet";
}

function getTypeIcon(type: string) {
  if (type === "income") return { Icon: ArrowUpRight, bg: "bg-green-50", text: "text-green-600" };
  if (type === "transfer") return { Icon: ArrowLeftRight, bg: "bg-blue-50", text: "text-blue-600" };
  return { Icon: ArrowDownRight, bg: "bg-red-50", text: "text-red-600" };
}

function getAmountColor(type: string): string {
  if (type === "income") return "text-green-600";
  if (type === "transfer") return "text-blue-600";
  return "text-red-600";
}

function getAmountPrefix(type: string): string {
  if (type === "income") return "+";
  if (type === "transfer") return "";
  return "-";
}

export function CalendarDayDetail({ selectedDay, transactions, wallets, onBack, isMobile }: CalendarDayDetailProps) {
  if (!selectedDay) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center justify-center min-h-[300px]">
        <p className="text-sm text-gray-400">Select a day to view details</p>
      </div>
    );
  }

  const dayTxs = transactions
    .filter(t => {
      const d = new Date(t.created_at);
      return d.getFullYear() === selectedDay.getFullYear()
        && d.getMonth() === selectedDay.getMonth()
        && d.getDate() === selectedDay.getDate();
    })
    .sort((a, b) => b.created_at - a.created_at);

  const income = dayTxs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = dayTxs.filter(t => t.type === "expense" || t.type === "savings" || t.type === "debt_payment").reduce((s, t) => s + t.amount, 0);
  const transfer = dayTxs.filter(t => t.type === "transfer").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        {isMobile && onBack && (
          <button
            onClick={onBack}
            className="flex items-center justify-center h-9 w-9 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
        )}
        <div>
          <div className="text-lg sm:text-xl font-bold text-gray-900">
            {format(selectedDay, "MMMM d")}
          </div>
          <div className="text-xs text-gray-400">{format(selectedDay, "EEEE")}</div>
        </div>
      </div>

      {/* Day summary mini-cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-green-50 rounded-xl p-2.5 text-center">
          <div className="text-[10px] text-green-600 font-medium">Income</div>
          <div className="text-sm sm:text-base font-bold text-green-600">₱{income.toLocaleString()}</div>
        </div>
        <div className="bg-red-50 rounded-xl p-2.5 text-center">
          <div className="text-[10px] text-red-600 font-medium">Expense</div>
          <div className="text-sm sm:text-base font-bold text-red-600">₱{expense.toLocaleString()}</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-2.5 text-center">
          <div className="text-[10px] text-blue-600 font-medium">Transfer</div>
          <div className="text-sm sm:text-base font-bold text-blue-600">₱{transfer.toLocaleString()}</div>
        </div>
      </div>

      {/* Transaction list */}
      <div className="text-xs font-semibold text-gray-700 mb-2">Transactions</div>

      {dayTxs.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-400">
          No transactions on this day
        </div>
      ) : (
        <div className="border-t border-gray-100">
          {dayTxs.map(tx => {
            const { Icon, bg, text } = getTypeIcon(tx.type);
            const walletName = getWalletName(tx, wallets);
            return (
              <div key={tx._id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-b-0">
                <div className={cn("flex items-center justify-center h-8 w-8 rounded-lg shrink-0", bg)}>
                  <Icon className={cn("h-4 w-4", text)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-900 truncate">{tx.category || "Transaction"}</div>
                  <div className="text-[10px] text-gray-400 truncate">{walletName}</div>
                </div>
                <div className={cn("text-xs font-semibold shrink-0", getAmountColor(tx.type))}>
                  {getAmountPrefix(tx.type)}₱{tx.amount.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
