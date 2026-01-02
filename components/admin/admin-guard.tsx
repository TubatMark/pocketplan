"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserKey } from "@/lib/session";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ShieldX, Lock, ArrowRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const userKey = useUserKey();

  // Fetch user profile to check role
  const user = useQuery(api.users.me, { userKey });

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showDenied, setShowDenied] = useState(false);

  useEffect(() => {
    if (user === undefined) return; // Loading

    if (!userKey) {
      // Not logged in - redirect to sign in
      router.push("/sign-in");
      return;
    }

    if (user === null) {
      // Session invalid
      router.push("/sign-in");
      return;
    }

    if (user.role !== "admin") {
      // Logged in but not admin - show access denied
      setShowDenied(true);
    } else {
      setIsAuthorized(true);
    }
  }, [user, userKey, router]);

  // Initial loading state
  if (user === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Access denied state
  if (showDenied || !isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md border-none shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <ShieldX className="h-8 w-8 text-red-600" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-500 text-sm mb-6">
              You don&apos;t have permission to access the admin panel. This area is restricted to administrators only.
            </p>

            <div className="space-y-3 text-left bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                To access admin features:
              </h3>
              <ul className="text-xs text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Sign in with an admin account</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Or seed the admin via CLI: <code className="bg-gray-200 px-1 py-0.5 rounded text-xs">npx convex run admin:seedAdmin</code></span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={() => router.push("/sign-in")} className="w-full">
                Sign In as Admin
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => router.push("/dashboard")} className="w-full">
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Button>
            </div>

            <p className="mt-6 text-xs text-gray-400">
              Admin credentials: <span className="font-mono">admin@admin.com</span> / <span className="font-mono">admin123</span>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
