"use client";
import { useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricExplainerProps {
  isOpen: boolean;
  onClose: () => void;
  type: "balance" | "spending" | "portfolio" | "investment" | "expensePerDay" | null;
}

export function MetricExplainer({ isOpen, onClose, type }: MetricExplainerProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !type) return null;

  const content = {
    balance: {
      title: "Total Balance",
      description: "This represents the total amount of money you currently have across all your connected wallets (Cash, E-Wallets, Banks). It is your liquid net worth available for spending or saving."
    },
    spending: {
      title: "Monthly Spending",
      description: "This tracks your total expenses for the current month. Keeping this number lower than your income is key to saving money. The trend indicator shows how your spending compares to last month."
    },
    portfolio: {
      title: "Monthly Income",
      description: "This shows your total income for the current month from all sources. The trend indicator shows how your income compares to last month."
    },
    investment: {
      title: "Net Savings",
      description: "This is the difference between your income and expenses for the current month. A positive number means you're saving money, while a negative number means you're spending more than you earn."
    },
    expensePerDay: {
      title: "Expense Per Day",
      description: "Your average daily spending for the current month, calculated by dividing total expenses by the number of days elapsed. Use this to track if your daily spending is sustainable within your budget."
    }
  };

  const info = content[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-label={info.title} onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-lg border bg-white p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
          <h2 className="text-lg font-semibold leading-none tracking-tight">{info.title}</h2>
          <p className="pt-4 text-base text-gray-500">
            {info.description}
          </p>
        </div>
      </div>
    </div>
  );
}
