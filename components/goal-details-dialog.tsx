"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import { slugify } from "@/lib/utils";
import Link from "next/link";
import { FileText } from "lucide-react";

interface GoalDetailsDialogProps {
  goal: any;
  progressData: { progress: number; remaining: number; saved: number } | undefined;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (goalId: string, updates: any) => Promise<void>;
  onDelete: (goalId: string) => Promise<void>;
}

export function GoalDetailsDialog({ goal, progressData, isOpen, onClose, onUpdate, onDelete }: GoalDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState(0);
  const [months, setMonths] = useState(1);

  useEffect(() => {
    if (goal) {
      setName(goal.slug);
      setAmount(goal.target_amount);
      setMonths(goal.target_months);
    }
  }, [goal]);

  if (!goal) return null;

  const handleUpdate = async () => {
    await onUpdate(goal._id, {
      slug: slugify(name),
      target_amount: amount,
      target_months: months,
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this goal?")) {
      await onDelete(goal._id);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Goal" : "Goal Details"}</DialogTitle>
        </DialogHeader>

        {isEditing ? (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Goal Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Target Amount</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
            </div>
            <div className="grid gap-2">
              <Label>Target Months</Label>
              <Input type="number" value={months} onChange={(e) => setMonths(Number(e.target.value))} />
            </div>
          </div>
        ) : (
          <div className="grid gap-6 py-4">
            {/* Top Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="text-xs text-gray-500">Target Amount</div>
                <div className="text-lg font-bold text-gray-900">₱{goal.target_amount.toLocaleString()}</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="text-xs text-gray-500">Achieved</div>
                <div className="text-lg font-bold text-green-700">₱{progressData?.saved.toLocaleString() ?? 0}</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">Progress</span>
                <span className="font-bold text-blue-600">{progressData?.progress.toFixed(1)}%</span>
              </div>
              <Progress value={progressData?.progress ?? 0} className="h-3" />
            </div>

            {/* Details List */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Created On</span>
                <span className="font-medium">{new Date(goal.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Deadline</span>
                <span className="font-medium">{new Date(goal.deadline).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Target Months</span>
                <span className="font-medium">{goal.target_months}</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-gray-500">Daily Savings</span>
                <span className="font-medium">₱{goal.required_daily_savings.toFixed(2)}</span>
              </div>
            </div>

            {/* AI Plan Link */}
            <div className="rounded-lg bg-indigo-50 p-4 flex items-center justify-between">
               <div className="flex items-center gap-2 text-indigo-700">
                 <FileText className="h-4 w-4" />
                 <span className="text-sm font-medium">AI Financial Plan</span>
               </div>
               <Link href={`/planning?goalId=${goal._id}`}>
                 <Button size="sm" variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800">
                   View Plan
                 </Button>
               </Link>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {isEditing ? (
            <>
              <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button onClick={handleUpdate}>Save Changes</Button>
            </>
          ) : (
            <>
              <Button variant="destructive" onClick={handleDelete}>Delete Goal</Button>
              <Button onClick={() => setIsEditing(true)}>Edit Goal</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
