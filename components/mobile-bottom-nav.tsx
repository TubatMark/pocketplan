"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  PiggyBank,
  CreditCard,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/transactions", label: "Activity", icon: ArrowLeftRight },
  { href: "/budget", label: "Budget", icon: PiggyBank },
  { href: "/wallets", label: "Wallets", icon: Wallet },
  { href: "/debts", label: "Debts", icon: CreditCard },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <>
      <div className="h-20 md:hidden" />
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white/90 backdrop-blur-md pb-safe md:hidden">
        <div className="flex items-stretch justify-around px-1 pt-1.5 pb-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-2 transition-colors",
                  isActive ? "text-gray-900" : "text-gray-400 hover:text-gray-700"
                )}
              >
                {isActive && (
                  <span className="absolute -top-px left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-gray-900" />
                )}
                <item.icon className={cn("h-[22px] w-[22px]", isActive && "stroke-[2.25]")} />
                <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
