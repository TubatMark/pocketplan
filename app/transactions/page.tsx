"use client";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useData } from "@/hooks/use-data";
import { useAction as useActionHook } from "@/hooks/use-action";
import { TransactionListSkeleton } from "@/components/skeletons";
import { useState, useMemo } from "react";
import { useUserKey } from "@/lib/session";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Search } from "lucide-react";
import { format } from "date-fns";

const ITEMS_PER_PAGE = 10;

const DEFAULT_CATEGORIES = [
  "House Rent",
  "Internet Bill",
  "Mobile Bill",
  "Electric Bill",
  "Food",
  "Wants",
];

function TransactionsContent() {
  const userKey = useUserKey();
  
  // Data hooks
  const { data: wallets } = useData<any[]>("wallets:list" as any, { userKey } as any);
  const { data: transactions, isLoading: isTransactionsLoading, refresh: refreshTransactions } = useData<any[]>("transactions:list" as any, { userKey } as any);
  
  // Action hook
  const { mutate: logTx, isLoading: isLogging } = useActionHook("transactions:log" as any, {
    onSuccess: () => refreshTransactions()
  });

  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState(0);
  
  // Category State
  const [categoryMode, setCategoryMode] = useState<"select" | "custom">("select");
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState("");

  const [walletId, setWalletId] = useState<string | null>(null);
  const [fromWalletId, setFromWalletId] = useState<string | null>(null);
  const [toWalletId, setToWalletId] = useState<string | null>(null);
  const [goalId, setGoalId] = useState<string | null>(null);
  const [method, setMethod] = useState("");
  const [notes, setNotes] = useState("");

  const { data: goals } = useData<any[]>("goals:list" as any, { userKey } as any);

  const finalCategory = (type === "transfer" || type === "income" || type === "savings") 
    ? (type === "transfer" ? "Transfer" : (type === "savings" ? "Savings" : "Income")) 
    : (categoryMode === "select" ? selectedCategory : customCategory);

  // Filter State
  const [filterType, setFilterType] = useState<"all" | "income" | "expense" | "transfer" | "savings">("all");
  const [dateRange, setDateRange] = useState<"all" | "today" | "week" | "month">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterWallet, setFilterWallet] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter Logic
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    let filtered = [...transactions];

    // Filter by Type
    if (filterType !== "all") {
      filtered = filtered.filter(t => t.type === filterType);
    }

    // Filter by Wallet
    if (filterWallet !== "all") {
      filtered = filtered.filter(t => t.wallet_id === filterWallet || t.transfer_from_wallet_id === filterWallet || t.transfer_to_wallet_id === filterWallet);
    }

    // Filter by Date
    if (dateRange !== "all") {
      const now = new Date();
      const startOfDay = new Date(now.setHours(0, 0, 0, 0)).getTime();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).setHours(0, 0, 0, 0);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

      filtered = filtered.filter(t => {
        if (dateRange === "today") return t.created_at >= startOfDay;
        if (dateRange === "week") return t.created_at >= startOfWeek;
        if (dateRange === "month") return t.created_at >= startOfMonth;
        return true;
      });
    }

    // Search Filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        (t.notes && t.notes.toLowerCase().includes(lowerQuery)) ||
        (t.category && t.category.toLowerCase().includes(lowerQuery)) ||
        (t.amount.toString().includes(lowerQuery))
      );
    }

    return filtered.sort((a, b) => b.created_at - a.created_at);
  }, [transactions, filterType, dateRange, filterWallet, searchQuery]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
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
      <div className="space-y-8">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Log Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <Label>Type</Label>
                <Select value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                  <option value="transfer">Transfer</option>
                  <option value="savings">Savings</option>
                </Select>
              </div>
              <div>
                <Label>Amount</Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label className={(type === "transfer" || type === "income" || type === "savings") ? "text-gray-400" : ""}>Category</Label>
                  <button 
                    onClick={() => setCategoryMode(prev => prev === "select" ? "custom" : "select")}
                    className={`text-xs hover:underline ${(type === "transfer" || type === "income" || type === "savings") ? "text-gray-300 cursor-not-allowed no-underline" : "text-blue-600"}`}
                    disabled={type === "transfer" || type === "income" || type === "savings"}
                  >
                    {categoryMode === "select" ? "Enter custom" : "Select list"}
                  </button>
                </div>
                {categoryMode === "select" ? (
                  <Select 
                    value={(type === "transfer" || type === "income" || type === "savings") ? (type === "transfer" ? "Transfer" : (type === "savings" ? "Savings" : "Income")) : selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    disabled={type === "transfer" || type === "income" || type === "savings"}
                    className={(type === "transfer" || type === "income" || type === "savings") ? "bg-gray-100 text-gray-500" : ""}
                  >
                    {(type === "transfer" || type === "income" || type === "savings") ? (
                       <option value={type === "transfer" ? "Transfer" : (type === "savings" ? "Savings" : "Income")}>{type === "transfer" ? "Transfer" : (type === "savings" ? "Savings" : "Income")}</option>
                    ) : (
                      DEFAULT_CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))
                    )}
                  </Select>
                ) : (
                  <Input 
                    value={(type === "transfer" || type === "income" || type === "savings") ? (type === "transfer" ? "Transfer" : (type === "savings" ? "Savings" : "Income")) : customCategory} 
                    onChange={(e) => setCustomCategory(e.target.value)} 
                    placeholder="Enter category name" 
                    disabled={type === "transfer" || type === "income" || type === "savings"}
                    className={(type === "transfer" || type === "income" || type === "savings") ? "bg-gray-100 text-gray-500" : ""}
                  />
                )}
              </div>
            </div>

            {type !== "transfer" && (
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div>
                  <Label>Wallet</Label>
                  <Select value={walletId ?? ""} onChange={(e) => setWalletId(e.target.value)}>
                    <option value="">Select wallet</option>
                    {wallets?.map((w: any) => (
                      <option key={w._id} value={w._id}>{w.name}</option>
                    ))}
                  </Select>
                </div>
                {/* Method Removed - Auto determined */}
                <div className="md:col-span-2">
                  <Label>Notes</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
                {/* Optional Goal Assignment */}
                <div className="md:col-span-3 border-t pt-3 mt-2">
                   <Label className="text-gray-500">Assign to Goal {type === "savings" ? "(Required)" : "(Optional)"}</Label>
                   <Select value={goalId ?? ""} onChange={(e) => setGoalId(e.target.value || null)}>
                     <option value="">None</option>
                     {goals?.map((g: any) => (
                       <option key={g._id} value={g._id}>{g.slug} (Target: ₱{g.target_amount.toLocaleString()})</option>
                     ))}
                   </Select>
                   <p className="text-xs text-gray-400 mt-1">If selected, this amount will contribute towards the goal's progress.</p>
                </div>
              </div>
            )}

            {type === "transfer" && (
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div>
                  <Label>From Wallet</Label>
                  <Select value={fromWalletId ?? ""} onChange={(e) => setFromWalletId(e.target.value)}>
                    <option value="">Select wallet</option>
                    {wallets?.map((w: any) => (
                      <option key={w._id} value={w._id}>{w.name}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>To Wallet</Label>
                  <Select value={toWalletId ?? ""} onChange={(e) => setToWalletId(e.target.value)}>
                    <option value="">Select wallet</option>
                    {wallets?.map((w: any) => (
                      <option key={w._id} value={w._id}>{w.name}</option>
                    ))}
                  </Select>
                </div>
                <div className="md:col-span-1">
                  <Label>Notes</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
                {/* Optional Goal Assignment for Transfers */}
                <div className="md:col-span-3 border-t pt-3 mt-2">
                   <Label className="text-gray-500">Assign to Goal (Optional)</Label>
                   <Select value={goalId ?? ""} onChange={(e) => setGoalId(e.target.value || null)}>
                     <option value="">None</option>
                     {goals?.map((g: any) => (
                       <option key={g._id} value={g._id}>{g.slug} (Target: ₱{g.target_amount.toLocaleString()})</option>
                     ))}
                   </Select>
                   <p className="text-xs text-gray-400 mt-1">Example: Transferring money to a savings wallet for this goal.</p>
                </div>
              </div>
            )}

            <div className="mt-4">
              <Button
                disabled={isLogging}
                onClick={async () => {
                  if (amount <= 0) return;
                  if (type === "transfer") {
                    if (!fromWalletId || !toWalletId) return;
                    await logTx({ 
                      userKey, 
                      amount, 
                      type: "transfer", 
                      category: "Transfer", // Hardcode category for transfers
                      transfer_from_wallet_id: fromWalletId as any, 
                      transfer_to_wallet_id: toWalletId as any, 
                      notes,
                      goal_id: goalId as any // Pass goal ID
                    });
                  } else {
                    if (!walletId) return;
                    await logTx({ 
                      userKey, 
                      amount, 
                      type: type as any, 
                      category: finalCategory, 
                      wallet_id: walletId as any, 
                      method, 
                      notes,
                      goal_id: goalId as any // Pass goal ID
                    });
                  }
                  setAmount(0);
                  setCustomCategory("");
                  setWalletId(null);
                  setFromWalletId(null);
                  setToWalletId(null);
                  setGoalId(null);
                  setMethod("");
                  setNotes("");
                }}
              >
                {isLogging ? "Adding..." : "Add Transaction"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            <div className="flex gap-2">
              <Select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="w-[120px] h-8 text-xs">
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="transfer">Transfer</option>
                <option value="savings">Savings</option>
              </Select>
              <Select value={dateRange} onChange={(e) => setDateRange(e.target.value as any)} className="w-[120px] h-8 text-xs">
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
               <div className="relative">
                 <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                 <Input 
                   placeholder="Search transactions..." 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="pl-9"
                 />
               </div>
            </div>

            {isTransactionsLoading ? (
              <TransactionListSkeleton />
            ) : (
            <>
            <div className="rounded-3xl bg-white shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="border-b border-gray-50 bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Wallet</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(paginatedTransactions ?? []).map((t: any) => {
                    const walletName = wallets?.find(w => w._id === t.wallet_id)?.name || 
                                     (t.type === 'transfer' ? 'Transfer' : 'Wallet');
                    return (
                    <tr key={t._id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${t.category}`} />
                            <AvatarFallback>{t.category?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{t.category || "Transaction"}</span>
                            {t.notes && <span className="text-xs text-gray-400 truncate max-w-[150px]">{t.notes}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {walletName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {format(new Date(t.created_at), "MMM d, yyyy")}
                      </td>
                      <td className={`px-6 py-4 text-right font-semibold ${
                        t.type === 'income' ? 'text-green-600' : 
                        t.type === 'savings' ? 'text-emerald-600' :
                        'text-gray-900'
                      }`}>
                        {t.type === 'income' ? '+' : ''}₱{t.amount.toLocaleString()}
                      </td>
                    </tr>
                  )})}
                  {(!paginatedTransactions || paginatedTransactions.length === 0) && (
                     <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400">
                        No transactions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {filteredTransactions.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between border-t px-6 py-4 mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
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
            )}
            </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

export default function TransactionsPage() {
  return <TransactionsContent />;
}
