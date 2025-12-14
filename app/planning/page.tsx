"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useData } from "@/hooks/use-data";
import { useAction as useActionHook } from "@/hooks/use-action";
import { useUserKey } from "@/lib/session";
import { useState, useEffect } from "react";
import { Target, Sparkles, Loader2, FileText, CheckCircle2 } from "lucide-react";
import { GoalCardSkeleton } from "@/components/skeletons";
import { useSearchParams } from "next/navigation";

export default function PlanningPage() {
  const userKey = useUserKey();
  const searchParams = useSearchParams();
  const goalIdParam = searchParams.get("goalId");
  
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  
  // Data Fetching
  const { data: goals, isLoading: isGoalsLoading } = useData<any[]>("goals:list" as any, { userKey } as any);
  
  // Fetch Plan if goal selected
  const { data: existingPlan, isLoading: isPlanLoading, refresh: refreshPlan } = useData<any>(
    "plans:getPlan" as any, 
    selectedGoalId ? { userKey, goalId: selectedGoalId as any } : "skip" as any
  );

  // Actions
  const { mutate: generatePlan, isLoading: isGenerating } = useActionHook("plans:generate" as any, {
    onSuccess: () => refreshPlan(),
    type: "action"
  });

  // Effect to handle URL param
  useEffect(() => {
    if (goalIdParam) {
      setSelectedGoalId(goalIdParam);
    }
  }, [goalIdParam]);

  // Auto-select first goal if available and none selected (and no param)
  useEffect(() => {
    if (!selectedGoalId && !goalIdParam && goals && goals.length > 0) {
      setSelectedGoalId(goals[0]._id);
    }
  }, [goals, selectedGoalId, goalIdParam]);

  const selectedGoal = goals?.find(g => g._id === selectedGoalId);

  return (
    <DashboardShell>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Financial Planner</h2>
          <p className="text-muted-foreground mt-2">
            Select a goal to generate a personalized, step-by-step action plan using advanced AI.
          </p>
        </div>

        {/* Goal Selection */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-emerald-600" />
              Select Goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isGoalsLoading ? (
              <GoalCardSkeleton />
            ) : goals && goals.length > 0 ? (
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="w-full md:w-1/3 space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Target Goal
                  </label>
                  <Select 
                    value={selectedGoalId} 
                    onChange={(e) => setSelectedGoalId(e.target.value)}
                    className="w-full"
                  >
                    {goals.map((g: any) => (
                      <option key={g._id} value={g._id}>
                        {g.slug} (₱{g.target_amount.toLocaleString()})
                      </option>
                    ))}
                  </Select>
                </div>
                
                <Button 
                  onClick={() => generatePlan({ userKey, goalId: selectedGoalId as any })}
                  disabled={isGenerating || !selectedGoalId}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Plan...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      {existingPlan ? "Regenerate Plan" : "Generate AI Plan"}
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                You haven't created any goals yet. Go to the Goals page to start.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plan Display */}
        {selectedGoalId && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {isGenerating ? (
              <Card className="border-dashed border-2 border-indigo-200 bg-indigo-50/50">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="relative">
                    <div className="absolute inset-0 animate-ping rounded-full bg-indigo-200 opacity-75"></div>
                    <div className="relative rounded-full bg-indigo-100 p-4">
                      <Sparkles className="h-8 w-8 text-indigo-600 animate-pulse" />
                    </div>
                  </div>
                  <h3 className="mt-6 text-lg font-semibold text-indigo-900">Creating your financial roadmap...</h3>
                  <p className="mt-2 text-sm text-indigo-600 max-w-sm">
                    Analyzing your transaction history, current savings, and target deadline to build the perfect strategy for {selectedGoal?.slug}.
                  </p>
                </CardContent>
              </Card>
            ) : existingPlan ? (
              <Card className="border-none shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-8 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="h-6 w-6 text-indigo-100" />
                    <h3 className="text-xl font-bold">{existingPlan.title}</h3>
                  </div>
                  <p className="text-indigo-100 text-sm">
                    Generated on {new Date(existingPlan.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <CardContent className="p-8">
                  <div className="prose prose-slate max-w-none">
                    {/* Simple Markdown rendering replacement since we might not have a markdown library */}
                    {existingPlan.content.split('\n').map((line: string, i: number) => {
                      // Headers
                      if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold mt-6 mb-2 text-gray-900">{line.replace('### ', '')}</h3>;
                      if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-8 mb-4 text-gray-900 border-b pb-2">{line.replace('## ', '')}</h2>;
                      if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold mt-8 mb-4 text-gray-900">{line.replace('# ', '')}</h1>;
                      
                      // Lists
                      if (line.trim().startsWith('- ')) return (
                        <div key={i} className="flex gap-2 mb-2 ml-4">
                          <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                          <p className="text-gray-700">{line.replace('- ', '')}</p>
                        </div>
                      );
                      
                      // Bold
                      const parts = line.split('**');
                      if (parts.length > 1) {
                        return (
                          <p key={i} className="mb-4 text-gray-700 leading-relaxed">
                            {parts.map((part, index) => 
                              index % 2 === 1 ? <strong key={index} className="font-semibold text-gray-900">{part}</strong> : part
                            )}
                          </p>
                        );
                      }

                      // Empty lines
                      if (!line.trim()) return <div key={i} className="h-2" />;

                      // Standard Paragraph
                      return <p key={i} className="mb-4 text-gray-700 leading-relaxed">{line}</p>;
                    })}
                  </div>
                  
                  <div className="mt-8 flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg border border-green-100">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-sm font-medium">This plan is saved to your account. You can revisit it anytime.</span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-xl bg-gray-50/50">
                <div className="rounded-full bg-gray-100 p-4 mb-4">
                  <Target className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">No Plan Generated Yet</h3>
                <p className="text-sm text-gray-500 max-w-sm mt-2">
                  Click the "Generate AI Plan" button above to get a customized strategy for reaching your <strong>{selectedGoal?.slug}</strong> goal.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
