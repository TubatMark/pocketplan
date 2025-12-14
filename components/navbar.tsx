"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Dashboard" },
  { href: "/goal", label: "Goal" },
  { href: "/transactions", label: "Transactions" },
  { href: "/wallets", label: "Wallets" },
  { href: "/analytics", label: "Analytics" },
  { href: "/settings", label: "Settings" },
];

export function Navbar() {
  const pathname = usePathname();
  return (
    <nav className="border-b bg-background">
      <div className="container flex h-12 items-center gap-4">
        <div className="font-semibold">PocketPlan</div>
        <div className="flex gap-3">
          {items.map((i) => (
            <Link key={i.href} href={i.href} className={cn("text-sm", pathname === i.href ? "text-primary" : "text-muted-foreground hover:text-foreground")}>{i.label}</Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

