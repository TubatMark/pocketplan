"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function ActivityList({ activities }: { activities: any[] }) {
  if (!activities?.length) {
    return <div className="text-sm text-gray-500">No recent activity</div>;
  }

  return (
    <div className="space-y-4">
      {activities.map((a) => (
        <div key={a._id} className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl",
              a.type.includes("income") ? "bg-green-100" : 
              a.type.includes("expense") ? "bg-orange-50" : 
              a.type.includes("goal") ? "bg-purple-100" :
              a.type.includes("debt") ? "bg-red-50" :
              "bg-blue-50"
            )}>
              <span className="text-lg">
                {a.type.includes("goal") ? "🎯" :
                 a.type.includes("wallet") ? "💳" :
                 a.type.includes("debt") ? "📉" :
                 a.type === "income" ? "💰" : 
                 a.type === "expense" ? "💸" : "📝"}
              </span>
            </div>
            <div>
              <div className="font-semibold text-gray-900">{a.description}</div>
              <div className="text-xs text-gray-500">{new Date(a.created_at).toLocaleString()}</div>
            </div>
          </div>
          {a.amount !== undefined && (
            <div className={cn(
              "font-bold",
              a.type.includes("expense") || (a.type === "debt_payment" && !a.description.includes("Received")) ? "text-red-600" :
              a.type.includes("income") || (a.type === "debt_payment" && a.description.includes("Received")) ? "text-green-600" :
              "text-gray-900"
            )}>
              {a.type.includes("expense") || (a.type === "debt_payment" && !a.description.includes("Received")) ? "-" : "+"}₱{a.amount.toLocaleString()}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
