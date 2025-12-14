"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  Home, 
  PieChart, 
  ArrowRightLeft, 
  Target,
  Activity,
  Menu,
  CreditCard,
  Database
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/transactions", label: "Transact", icon: ArrowRightLeft },
  { href: "/goal", label: "Goals", icon: Target },
  { href: "/debts", label: "Debts", icon: CreditCard },
  { href: "/planning", label: "Plan", icon: Activity },
  { href: "/backup", label: "Backup", icon: Database },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Spacer to prevent content from being hidden behind the fixed nav */}
      <div className="h-16 md:hidden" />
      
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-gray-200 bg-white px-2 pb-safe pt-2 md:hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-2 text-xs font-medium transition-colors",
                isActive ? "text-black" : "text-gray-500 hover:text-gray-900"
              )}
            >
              <item.icon className={cn("mb-1 h-6 w-6", isActive && "fill-current")} />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
        
        {/* Mobile Menu Trigger for less common items */}
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center p-2 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors">
              <Menu className="mb-1 h-6 w-6" />
              <span className="text-[10px]">Menu</span>
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[300px]">
            {/* Reusing the existing Sidebar content inside the sheet */}
            <div className="h-full overflow-y-auto">
               <Sidebar mobile />
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </>
  );
}
