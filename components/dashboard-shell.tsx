"use client";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { ReactNode, useEffect } from "react";
import { useUserKey } from "@/lib/session";
import { useRouter } from "next/navigation";

export function DashboardShell({ children }: { children: ReactNode }) {
  const userKey = useUserKey();
  const router = useRouter();

  useEffect(() => {
    // If no session token, redirect to login
    if (typeof window !== "undefined" && !window.localStorage.getItem("pp_session_token")) {
      router.push("/login");
    }
  }, [userKey, router]);

  if (!userKey) {
    return null; // or a loading spinner
  }

  return (
    <div className="flex min-h-screen bg-gray-50/50 pb-16 md:pb-0">
      <Sidebar />
      <div className="flex flex-1 flex-col md:pl-64 transition-all duration-300 w-full">
        <Header />
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <div className="mx-auto max-w-7xl w-full">
            {children}
          </div>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
