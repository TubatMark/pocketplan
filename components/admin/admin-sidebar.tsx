"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, LogOut, BarChart3, MessageSquare, X, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Traffic",
    href: "/admin/traffic",
    icon: BarChart3,
  },
  {
    title: "Messages",
    href: "/admin/messages",
    icon: MessageSquare,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
];

export function AdminSidebar({ isOpen, onClose, mobile }: { isOpen: boolean; onClose: () => void; mobile?: boolean }) {
  const pathname = usePathname();

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (mobile) onClose();
  }, [pathname, mobile, onClose]);

  return (
    <>
      {/* Mobile Overlay */}
      {mobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed md:sticky inset-y-0 left-0 z-50 flex flex-col border-r bg-gray-900 text-white transition-transform duration-300 md:translate-x-0",
          "w-64 shrink-0",
          mobile ? (isOpen ? "translate-x-0" : "-translate-x-full") : "hidden md:flex"
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-800 px-6">
          <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold text-lg" onClick={onClose}>
            <span className="text-blue-500">Pocket</span>Admin
          </Link>
          {mobile && (
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="grid gap-1 px-2">
            {sidebarItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={index}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-800 p-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Exit Admin
          </Link>
        </div>
      </div>
    </>
  );
}

export function AdminHeader({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-gray-200 bg-white px-4 md:hidden">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
      >
        <Menu className="h-5 w-5" />
      </button>
      <span className="font-semibold">Admin Panel</span>
    </header>
  );
}
