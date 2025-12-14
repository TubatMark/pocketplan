"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function TransactionList({ transactions }: { transactions: any[] }) {
  if (!transactions?.length) {
    return <div className="text-sm text-gray-500">No recent transactions</div>;
  }

  return (
    <div className="space-y-4">
      {transactions.slice(0, 5).map((t) => (
        <div key={t._id} className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl",
              t.type === "income" ? "bg-green-100" : "bg-orange-50"
            )}>
              {/* Simple icons based on category or type */}
              <span className="text-lg">
                {t.category === "Shopping" ? "🛍️" : 
                 t.category === "Food" ? "🍔" :
                 t.category === "Transport" ? "✈️" :
                 t.type === "income" ? "💰" : "📄"}
              </span>
            </div>
            <div>
              <div className="font-semibold text-gray-900">{t.category || "Transaction"}</div>
              <div className="text-xs text-gray-500">{t.notes || t.method || "Payment"}</div>
            </div>
          </div>
          <div className="font-bold text-gray-900">
            {t.type === "expense" ? "-" : "+"}₱{t.amount.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
