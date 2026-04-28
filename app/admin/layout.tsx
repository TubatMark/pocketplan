"use client";

import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminBottomNav } from "@/components/admin/admin-bottom-nav";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50 pb-16 md:pb-0 md:pl-64">
        <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r bg-gray-900 text-white md:flex">
          <div className="flex h-16 items-center border-b border-gray-800 px-6">
            <span className="flex items-center gap-2 font-bold text-lg">
              <span className="text-blue-500">Pocket</span>Admin
            </span>
          </div>
          <nav className="flex-1 space-y-1 p-4">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-gray-800 p-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Exit Admin
            </Link>
          </div>
        </aside>

        <main className="p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl w-full">
            <div className="flex items-center gap-3 mb-6 md:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-white">
                <LayoutDashboard className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
                <p className="text-xs text-gray-500">Manage your application</p>
              </div>
            </div>
            {children}
          </div>
        </main>

        <AdminBottomNav />
      </div>
    </AdminGuard>
  );
}
