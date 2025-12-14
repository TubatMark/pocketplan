"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserKey } from "@/lib/session";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const userKey = useUserKey();
  
  // We need to fetch the user profile to check the role
  // Reusing users:me or creating a specific check
  const user = useQuery(api.users.me, { userKey });
  
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (user === undefined) return; // Loading

    if (user === null || user.role !== "admin") {
      router.push("/login"); // Or a specific "Access Denied" page
    } else {
      setIsAuthorized(true);
    }
  }, [user, router]);

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
