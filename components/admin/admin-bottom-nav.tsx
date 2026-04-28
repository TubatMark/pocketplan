"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, LogOut } from "lucide-react";

const adminNavItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/dashboard", label: "Exit", icon: LogOut, isExit: true },
];

export function AdminBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-gray-200 bg-white px-2 pb-safe pt-2 md:hidden">
      {adminNavItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center p-2 text-xs font-medium transition-colors",
              isActive
                ? "text-blue-600"
                : item.isExit
                  ? "text-orange-600 hover:text-orange-700"
                  : "text-gray-500 hover:text-gray-900"
            )}
          >
            <Icon className="mb-1 h-5 w-5" />
            <span className="text-[10px]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
