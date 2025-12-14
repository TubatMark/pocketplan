"use client";
import { Bell, Mail, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "convex/react";
import { useUserKey } from "@/lib/session";

export function Header() {
  const userKey = useUserKey();
  const me = useQuery("users:me" as any, { userKey } as any);

  return (
    <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-gray-100 bg-white/50 px-4 md:px-8 backdrop-blur-sm">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Welcome back</h1>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <div className="flex items-center gap-3 pl-0 md:pl-6 md:border-l md:border-gray-100">
          <Avatar className="h-8 w-8 md:h-10 md:w-10 border border-gray-100">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${me?.name ?? "user"}`} />
            <AvatarFallback>{me?.name?.[0] ?? "U"}</AvatarFallback>
          </Avatar>
          <div className="hidden md:block text-right">
            <p className="text-sm font-semibold leading-none">{me?.name ?? "Guest User"}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
