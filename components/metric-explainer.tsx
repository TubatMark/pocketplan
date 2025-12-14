"use client";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricExplainerProps {
  isOpen: boolean;
  onClose: () => void;
  type: "balance" | "spending" | "portfolio" | "investment" | null;
}

export function MetricExplainer({ isOpen, onClose, type }: MetricExplainerProps) {
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
      title: "Portfolio Value",
      description: "Your portfolio is a projection of your total financial health, including your current balance and estimated assets. In this system, it is currently calculated as 1.5x your balance to simulate asset value."
    },
    investment: {
      title: "Investment Potential",
      description: "This is the portion of your wealth that could be allocated to long-term growth. Currently calculated as 30% of your balance, it represents money you might consider moving into higher-yield vehicles."
    }
  };

  const info = content[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="relative w-full max-w-lg rounded-lg border bg-white p-6 shadow-lg">
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
