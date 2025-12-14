"use client";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { slugify } from "@/lib/utils";
import { useUserKey } from "@/lib/session";
import { Wallet as WalletIcon } from "lucide-react";
import { useData } from "@/hooks/use-data";
import { useAction as useActionHook } from "@/hooks/use-action"; 
import { WalletCardSkeleton } from "@/components/skeletons";

const types = [
  { value: "cash", label: "Cash" },
  { value: "ewallet", label: "E-Wallet" },
  { value: "bank", label: "Bank" },
  { value: "custom", label: "Custom" },
];

function WalletsContent() {
  const userKey = useUserKey();
  
  // Use new data hook with loading state
  const { data: wallets, isLoading, error, refresh } = useData<any[]>("wallets:list" as any, { userKey } as any);
  
  // Use new action hook
  const { mutate: createWallet, isLoading: isCreating } = useActionHook("wallets:create" as any, {
    onSuccess: () => refresh()
  });
  const { mutate: updateWallet, isLoading: isUpdating } = useActionHook("wallets:update" as any, {
    onSuccess: () => refresh()
  });
  const { mutate: removeWallet, isLoading: isDeleting } = useActionHook("wallets:remove" as any, {
    onSuccess: () => refresh()
  });

  const [name, setName] = useState("");
  const [type, setType] = useState("cash");
  const [balance, setBalance] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (error) {
    return (
      <DashboardShell>
        <div className="p-8 text-center text-red-500">
          Failed to load wallets. Please try again.
          <Button onClick={() => refresh()} className="ml-4">Retry</Button>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-8">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>{editingId ? "Edit Wallet" : "Create Wallet"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="GCash, Maya, BPI" disabled={isCreating || isUpdating} />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={type} onChange={(e) => setType(e.target.value)} disabled={isCreating || isUpdating}>
                  {types.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Starting Balance</Label>
                <Input type="number" value={balance} onChange={(e) => setBalance(Number(e.target.value))} disabled={isCreating || isUpdating} />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button 
                disabled={isCreating || isUpdating}
                onClick={async () => {
                  if (!name) return;
                  if (editingId) {
                    await updateWallet({ userKey, walletId: editingId as any, name, slug: slugify(name), type, balance });
                    setEditingId(null);
                  } else {
                    await createWallet({ userKey, name, slug: slugify(name), type, balance });
                  }
                  setName(""); setBalance(0); setType("cash");
                }}
              >
                {isCreating || isUpdating ? "Saving..." : (editingId ? "Update Wallet" : "Save Wallet")}
              </Button>
              {editingId && (
                <Button variant="outline" onClick={() => {
                  setEditingId(null);
                  setName(""); setBalance(0); setType("cash");
                }}>Cancel</Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div>
          <h3 className="mb-4 text-lg font-bold text-gray-900">Your Wallets</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {isLoading ? (
              // Loading Skeletons
              [1, 2, 3].map((i) => <WalletCardSkeleton key={i} />)
            ) : wallets?.map((w: any) => (
              <div key={w._id} className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                <div className="mb-4 flex items-center justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600`}>
                    <WalletIcon className="h-5 w-5" />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setEditingId(w._id);
                        setName(w.name);
                        setType(w.type);
                        setBalance(w.balance);
                      }}
                      className="text-gray-400 hover:text-blue-600"
                    >
                      <span className="text-xs font-medium">Edit</span>
                    </button>
                    <button 
                      onClick={() => removeWallet({ userKey, walletId: w._id })}
                      className="text-gray-400 hover:text-red-600"
                      disabled={isDeleting}
                    >
                      <span className="text-xs font-medium">Delete</span>
                    </button>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">{w.type}</div>
                  <div className="text-xl font-bold text-gray-900">{w.name}</div>
                  <div className="mt-2 text-2xl font-bold tracking-tight text-gray-900">₱{w.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
              </div>
            ))}
            {!isLoading && wallets?.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-500">
                No wallets found. Create one to get started.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

export default function WalletsPage() {
  return <WalletsContent />;
}
