"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  Home, 
  PieChart, 
  ArrowRightLeft, 
  Wallet, 
  Settings, 
  LogOut,
  Target,
  Activity,
  CreditCard,
  Database,
  List
} from "lucide-react";

const mainMenu = [
  { href: "/", label: "Home", icon: Home },
  { href: "/transactions", label: "Transaction", icon: ArrowRightLeft },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/activities", label: "Activities", icon: List },
  { href: "/debts", label: "Debts", icon: CreditCard },
  { href: "/planning", label: "Plan", icon: Activity }, // Note: Both use Activity icon currently, might want to change Plan icon
  { href: "/backup", label: "Backup", icon: Database },
];

const accountMenu = [
  { href: "/wallets", label: "My Wallets", icon: Wallet },
  { href: "/settings", label: "Setting", icon: Settings },
];

export function Sidebar({ mobile }: { mobile?: boolean }) {
  const pathname = usePathname();

  const NavItem = ({ item }: { item: any }) => {
    const isActive = pathname === item.href;
    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
          isActive
            ? "bg-black text-white"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        )}
      >
        <div className="flex items-center gap-3">
          <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-400")} />
          <span>{item.label}</span>
        </div>
        {item.badge && (
          <span className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full text-xs",
            isActive ? "bg-white text-black" : "bg-teal-500 text-white"
          )}>
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside className={cn(
      "h-screen w-64 border-r border-gray-100 bg-white p-6 flex flex-col",
      mobile ? "w-full border-none" : "fixed left-0 top-0 hidden md:flex"
    )}>
      <div className="mb-10 flex items-center gap-2 px-2">
        <div className="h-8 w-8 rounded-full bg-black"></div>
        <span className="text-xl font-bold tracking-tight">PocketPlan</span>
      </div>

      <div className="flex-1 space-y-8 overflow-y-auto no-scrollbar">
        <div>
          <div className="mb-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Main Menu
          </div>
          <nav className="space-y-1">
            {mainMenu.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
          </nav>
        </div>

        <div>
          <div className="mb-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Account Management
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
          className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          <LogOut className="h-5 w-5" />
          <span>Log out</span>
        </Link>
      </div>
    </aside>
  );
}
