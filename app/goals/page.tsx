"use client";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/utils";
import { useState } from "react";
import { useUserKey } from "@/lib/session";
import { Target } from "lucide-react";

import { GoalDetailsDialog } from "@/components/goal-details-dialog";
import { useData } from "@/hooks/use-data";
import { useAction as useActionHook } from "@/hooks/use-action";
import { GoalCardSkeleton } from "@/components/skeletons";

function GoalContent() {
  const userKey = useUserKey();
  
  // Data loading
  const { data: goals, isLoading: isGoalsLoading, refresh: refreshGoals } = useData<any[]>("goals:list" as any, { userKey } as any);
  const { data: stats, isLoading: isStatsLoading } = useData<any>("analytics:dashboard" as any, { userKey } as any);
  
  // Actions
  const { mutate: createGoal, isLoading: isCreating } = useActionHook("goals:create" as any, {
    onSuccess: () => refreshGoals()
  });
  const { mutate: updateGoal, isLoading: isUpdating } = useActionHook("goals:update" as any, {
    onSuccess: () => refreshGoals()
  });
  const { mutate: removeGoal, isLoading: isDeleting } = useActionHook("goals:remove" as any, {
    onSuccess: () => refreshGoals()
  });

  const [name, setName] = useState("");
  const [amount, setAmount] = useState(0);
  const [months, setMonths] = useState(1);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);

  // Smart Plan Calculations
  const monthlySavingsNeeded = amount / months;
  const currentMonthlyNet = stats?.monthNet ?? 0;
  const isFeasible = currentMonthlyNet >= monthlySavingsNeeded;
  const shortfall = monthlySavingsNeeded - currentMonthlyNet;
  const topExpense = stats?.spendingByCategory?.[0]?.label ?? "spending";

  return (
    <DashboardShell>
      <div className="space-y-8">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Create Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <Label>Goal Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Emergency Fund" disabled={isCreating} />
              </div>
              <div>
                <Label>Target Amount</Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} disabled={isCreating} />
              </div>
              <div>
                <Label>Target Months</Label>
                <Input type="number" value={months} onChange={(e) => setMonths(Number(e.target.value))} disabled={isCreating} />
              </div>
            </div>

            {/* Smart Plan Feedback */}
            {amount > 0 && !isStatsLoading && (
              <div className={`mt-6 rounded-lg border p-4 ${isFeasible ? "bg-green-50 border-green-100" : "bg-orange-50 border-orange-100"}`}>
                <h4 className={`text-sm font-semibold ${isFeasible ? "text-green-800" : "text-orange-800"}`}>
                  {isFeasible ? "✅ This goal is achievable!" : "⚠️ This goal might be tough."}
                </h4>
                <div className="mt-2 text-sm text-gray-600 space-y-1">
                  <p>
                    You need to save <strong>₱{monthlySavingsNeeded.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo</strong>. 
                    Based on this month, your net savings is <strong>₱{currentMonthlyNet.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>.
                  </p>
                  {!isFeasible && (
                    <p className="text-orange-700">
                      You are short by <strong>₱{shortfall.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo</strong>. 
                      Try reducing your <strong>{topExpense}</strong> expenses or extending the goal to <strong>{Math.ceil(amount / Math.max(1, currentMonthlyNet))} months</strong>.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4">
              <Button
                disabled={!name || amount <= 0 || isCreating}
                onClick={async () => {
                  if (!name || amount <= 0 || months <= 0) return;
                  await createGoal({ userKey, slug: slugify(name), target_amount: amount, target_months: months, start_date: Date.now() });
                  setName("");
                  setAmount(0);
                  setMonths(1);
                }}
              >{isCreating ? "Saving..." : "Save Goal"}</Button>
            </div>
          </CardContent>
        </Card>

        <div>
          <h3 className="mb-4 text-lg font-bold text-gray-900">Your Goals</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {isGoalsLoading ? (
              // Loading Skeletons
              [1, 2, 3].map((i) => <GoalCardSkeleton key={i} />)
            ) : goals?.map((g: any) => (
              <div key={g._id} className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <Target className="h-5 w-5" />
                  </div>
                  <button 
                    onClick={() => setSelectedGoal(g)}
                    className="text-gray-400 hover:text-blue-600"
                  >
                    <span className="text-xs font-medium">View Details</span>
                  </button>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">{new Date(g.deadline).toLocaleDateString()}</div>
                  <div className="text-xl font-bold text-gray-900">{g.slug}</div>
                  <div className="mt-2">
                    <div className="text-2xl font-bold tracking-tight text-gray-900">₱{g.target_amount.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Target for {g.target_months} months</div>
                  </div>
                  <div className="mt-4 border-t border-gray-100 pt-4">
                     <div className="flex justify-between text-sm">
                       <span className="text-gray-500">Daily Savings</span>
                       <span className="font-semibold text-gray-900">₱{g.required_daily_savings.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between text-sm mt-1">
                       <span className="text-gray-500">Saved</span>
                       {(() => {
                          const prog = stats?.goalProgress?.find((p: any) => p.slug === g.slug);
                          const savedAmount = prog?.saved ?? 0;
                          return <span className={`font-semibold ${savedAmount > 0 ? "text-emerald-600" : "text-gray-400"}`}>
                            ₱{savedAmount.toLocaleString()}
                          </span>
                       })()}
                     </div>
                  </div>
                </div>
              </div>
            ))}
            {!isGoalsLoading && goals?.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-500">
                No goals found. Set a goal to start saving.
              </div>
            )}
          </div>
        </div>

        <GoalDetailsDialog 
          goal={selectedGoal}
          progressData={stats?.goalProgress?.find((p: any) => p.slug === selectedGoal?.slug)}
          isOpen={!!selectedGoal}
          onClose={() => setSelectedGoal(null)}
          onUpdate={async (goalId, updates) => {
            await updateGoal({ userKey, goalId: goalId as any, ...updates });
          }}
          onDelete={async (goalId) => {
            await removeGoal({ userKey, goalId: goalId as any });
          }}
        />
      </div>
    </DashboardShell>
  );
}

export default function GoalPage() {
  return <GoalContent />;
}
