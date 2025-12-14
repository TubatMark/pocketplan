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

export function TopNav() {
  const pathname = usePathname();
  return (
    <div className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]">
      <div className="mx-auto w-full max-w-[1400px] px-6">
        <div className="flex h-14 items-center justify-between">
          <div className="text-base font-semibold">PocketPlan</div>
          <div className="flex gap-4">
            {items.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                className={cn(
                  "text-sm px-2 py-1 border-b",
                  pathname === i.href ? "border-[var(--ring)] text-[var(--primary)]" : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                )}
              >
                {i.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

