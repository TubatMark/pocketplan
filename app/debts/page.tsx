"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useData } from "@/hooks/use-data";
import { useAction as useActionHook } from "@/hooks/use-action";
import { useUserKey } from "@/lib/session";
import { useState } from "react";
import { Plus, ArrowUpRight, ArrowDownLeft, Trash2, Edit2, History } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PaymentHistoryDialog } from "@/components/payment-history-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function DebtsPage() {
  const userKey = useUserKey();
  const { data: debts, refresh: refreshDebts } = useData<any[]>("debts:list" as any, { userKey } as any);
  const { data: wallets } = useData<any[]>("wallets:list" as any, { userKey } as any);

  const { mutate: createDebt, isLoading: isCreating } = useActionHook("debts:create" as any, {
    onSuccess: () => {
      setIsOpen(false);
      refreshDebts();
    }
  });

  const { mutate: updateDebt, isLoading: isUpdating } = useActionHook("debts:update" as any, {
    onSuccess: () => {
      setEditOpen(null);
      refreshDebts();
    }
  });

  const { mutate: deleteDebt, isLoading: isDeleting } = useActionHook("debts:remove" as any, {
    onSuccess: () => {
      setDeleteOpen(null);
      refreshDebts();
    }
  });

  const { mutate: payDebt, isLoading: isPaying } = useActionHook("debts:makePayment" as any, {
    onSuccess: () => {
      setPaymentOpen(null);
      refreshDebts();
    }
  });

  const [isOpen, setIsOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState<any>(null);
  const [deleteOpen, setDeleteOpen] = useState<any>(null);
  const [historyOpen, setHistoryOpen] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("ongoing");

  // Form States
  const [name, setName] = useState("");
  const [type, setType] = useState<"owed_to_you" | "owed_by_you">("owed_by_you");
  const [amount, setAmount] = useState(0);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [selectedWallet, setSelectedWallet] = useState<string>("");

  const totalOwedByYou = debts?.filter((d: any) => d.type === "owed_by_you" && d.status === "active").reduce((acc: number, d: any) => acc + d.remaining_amount, 0) || 0;
  const totalOwedToYou = debts?.filter((d: any) => d.type === "owed_to_you" && d.status === "active").reduce((acc: number, d: any) => acc + d.remaining_amount, 0) || 0;

  // Filtered Debts Logic
  const filteredDebts = debts?.filter((d: any) => {
    if (activeTab === "completed") return d.status === "paid";
    if (activeTab === "lending") return d.type === "owed_to_you" && d.status === "active";
    if (activeTab === "borrowing") return d.type === "owed_by_you" && d.status === "active";
    return d.status === "active"; // Default: Ongoing (both types)
  }) || [];

  return (
    <DashboardShell>
      <TooltipProvider>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Debt Management</h2>
            <p className="text-muted-foreground">Track what you owe and what's owed to you.</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="mr-2 h-4 w-4" /> Add Debt
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Debt Record</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select value={type} onChange={(e) => setType(e.target.value as any)}>
                    <option value="owed_by_you">I Owe Money (Loan)</option>
                    <option value="owed_to_you">Someone Owes Me (Lending)</option>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Name (Person/Entity)</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Doe or Bank Name" />
                </div>
                <div className="grid gap-2">
                  <Label>Total Amount</Label>
                  <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
                </div>

                <div className="grid gap-2">
                  <Label>
                    {type === "owed_to_you" ? "Funding Source (Optional)" : "Deposit To Wallet (Optional)"}
                  </Label>
                  <Select value={selectedWallet} onChange={(e) => setSelectedWallet(e.target.value)}>
                    <option value="">No specific wallet</option>
                    {wallets?.map((wallet: any) => (
                      <option key={wallet._id} value={wallet._id}>
                        {wallet.name} (₱{wallet.balance.toLocaleString()})
                      </option>
                    ))}
                  </Select>
                  {selectedWallet && (
                    <p className="text-xs text-muted-foreground">
                      ₱{amount.toLocaleString()} will be {type === "owed_to_you" ? "deducted from" : "added to"} this wallet.
                    </p>
                  )}
                </div>

                <Button 
                  onClick={() => createDebt({ 
                    userKey, 
                    name, 
                    type, 
                    total_amount: amount,
                    walletId: selectedWallet || undefined
                  })} 
                  disabled={isCreating}
                >
                  {isCreating ? "Saving..." : "Save Record"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-red-50 border-red-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-red-600">Total You Owe</CardTitle>
              <ArrowDownLeft className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">₱{totalOwedByYou.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50 border-emerald-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-emerald-600">Total Owed To You</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-700">₱{totalOwedToYou.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
            <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
            <TabsTrigger value="lending">Lending</TabsTrigger>
            <TabsTrigger value="borrowing">Borrowing</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Debt List */}
        <div className="grid gap-6">
          {filteredDebts.map((debt: any) => (
            <Card key={debt._id} className="overflow-hidden">
              <div className={`h-2 w-full ${debt.type === 'owed_by_you' ? 'bg-red-500' : 'bg-emerald-500'}`} />
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold">{debt.name}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        debt.status === 'paid' ? 'bg-gray-100 text-gray-600' : 
                        debt.type === 'owed_by_you' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {debt.status === 'paid' ? 'Paid Off' : (debt.type === 'owed_by_you' ? 'You Owe' : 'Owes You')}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      Original Amount: ₱{debt.total_amount.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 mb-1">Remaining Balance</div>
                    <div className="text-2xl font-bold text-gray-900">₱{debt.remaining_amount.toLocaleString()}</div>
                    
                    {/* Progress Bar */}
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="w-32 mt-2">
                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${debt.type === 'owed_by_you' ? 'bg-red-500' : 'bg-emerald-500'}`} 
                              style={{ width: `${Math.min(100, ((debt.total_amount - debt.remaining_amount) / debt.total_amount) * 100)}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-gray-400 text-right mt-1">
                            {((debt.total_amount - debt.remaining_amount) / debt.total_amount * 100).toFixed(0)}% Paid
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Original: ₱{debt.total_amount.toLocaleString()}</p>
                        <p>Paid: ₱{(debt.total_amount - debt.remaining_amount).toLocaleString()}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setHistoryOpen(debt)}>
                    <History className="h-4 w-4 text-gray-500" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => {
                    setEditOpen(debt);
                    setName(debt.name);
                    setAmount(debt.total_amount);
                  }}>
                    <Edit2 className="h-4 w-4 text-gray-500" />
                  </Button>
                  
                  <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(debt)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>

                  {debt.status === 'active' && (
                    <Dialog open={paymentOpen === debt._id} onOpenChange={(open) => {
                      setPaymentOpen(open ? debt._id : null);
                      setPaymentAmount(0);
                      setSelectedWallet("");
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">Record Payment</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Record Payment for {debt.name}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label>Amount</Label>
                            <Input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(Number(e.target.value))} />
                          </div>
                          <div className="grid gap-2">
                            <Label>
                              {debt.type === 'owed_by_you' ? 'Deduct from Wallet (Optional)' : 'Add to Wallet (Optional)'}
                            </Label>
                            <Select value={selectedWallet} onChange={(e) => setSelectedWallet(e.target.value)}>
                              <option value="">None (Track only)</option>
                              {wallets?.map((w: any) => (
                                <option key={w._id} value={w._id}>{w.name} (₱{w.balance.toLocaleString()})</option>
                              ))}
                            </Select>
                          </div>
                          <Button 
                            onClick={() => payDebt({ 
                              userKey, 
                              debtId: debt._id as any, 
                              amount: paymentAmount,
                              walletId: selectedWallet ? selectedWallet as any : undefined
                            })} 
                            disabled={isPaying}
                          >
                            {isPaying ? "Processing..." : "Confirm Payment"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          
          {filteredDebts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No debts found in this category.
            </div>
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editOpen} onOpenChange={(open) => !open && setEditOpen(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Debt</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Total Amount</Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
                <p className="text-xs text-muted-foreground">Adjusting this will update the remaining balance.</p>
              </div>
              <Button onClick={() => updateDebt({ userKey, debtId: editOpen._id, name, total_amount: amount })} disabled={isUpdating}>
                {isUpdating ? "Updating..." : "Update Debt"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteOpen} onOpenChange={(open) => !open && setDeleteOpen(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Debt Record?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. It will permanently delete this debt and all associated payment history.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => deleteDebt({ userKey, debtId: deleteOpen._id })} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Payment History Dialog */}
        <PaymentHistoryDialog 
          debt={historyOpen} 
          isOpen={!!historyOpen} 
          onClose={() => setHistoryOpen(null)} 
        />
      </div>
      </TooltipProvider>
    </DashboardShell>
  );
}
