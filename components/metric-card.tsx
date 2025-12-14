"use client";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  subtext: string;
  trend?: "up" | "down";
  colorVar: string;
  icon?: any;
  onClick?: () => void;
}

export function MetricCard({ label, value, subtext, trend, colorVar, onClick }: MetricCardProps) {
  return (
    <Card 
      className={cn("border-none shadow-sm transition-shadow hover:shadow-md", onClick && "cursor-pointer")}
      onClick={onClick}
    >
      <CardContent className={cn("p-6 rounded-2xl", `bg-[hsl(var(${colorVar}))]`)}>
        <div className="flex items-start justify-between">
          <div className="text-sm font-medium text-gray-600">{label}</div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/50">
            <ArrowUpRight className="h-4 w-4 text-gray-700" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-2xl font-bold tracking-tight text-gray-900">{value}</div>
          <div className="mt-1 text-xs text-gray-500">{subtext}</div>
        </div>
      </CardContent>
    </Card>
  );
}
