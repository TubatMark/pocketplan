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
  Settings,
  LogOut,
} from "lucide-react";

const mainMenu = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/wallets", label: "Wallets", icon: Wallet },
  { href: "/budget", label: "Budget", icon: PiggyBank },
  { href: "/debts", label: "Debts", icon: CreditCard },
];

const accountMenu = [
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ mobile }: { mobile?: boolean }) {
  const pathname = usePathname();

  const NavItem = ({ item }: { item: (typeof mainMenu)[number] }) => {
    const isActive = pathname === item.href;
    return (
      <Link
        href={item.href}
        className={cn(
          "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
          isActive
            ? "bg-gray-900 text-white shadow-sm"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        )}
      >
        <item.icon
          className={cn(
            "h-[18px] w-[18px] transition-colors",
            isActive ? "text-white" : "text-gray-400 group-hover:text-gray-700"
          )}
        />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        "h-screen w-64 border-r border-gray-100 bg-white p-5 flex flex-col",
        mobile ? "w-full border-none" : "fixed left-0 top-0 hidden md:flex"
      )}
    >
      <div className="mb-10 flex items-center gap-2.5 px-2 pt-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900">
          <PiggyBank className="h-5 w-5 text-white" />
        </div>
        <div className="leading-tight">
          <div className="text-base font-bold tracking-tight">PocketPlan</div>
          <div className="text-[11px] text-gray-400">Personal finance</div>
        </div>
      </div>

      <div className="flex-1 space-y-7 overflow-y-auto no-scrollbar">
        <div>
          <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
            Menu
          </div>
          <nav className="space-y-1">
            {mainMenu.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
          </nav>
        </div>

        <div>
          <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
            Account
          </div>
          <nav className="space-y-1">
            {accountMenu.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
          </nav>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-gray-100">
        <Link
          href="/logout"
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <LogOut className="h-[18px] w-[18px]" />
          <span>Log out</span>
        </Link>
      </div>
    </aside>
  );
}
