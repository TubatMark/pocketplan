"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { getUserKey, clearUserKey } from "@/lib/session";

export default function LogoutPage() {
  const router = useRouter();
  const signOut = useMutation("auth:signOut" as any);
  const logoutAttempted = useRef(false);

  useEffect(() => {
    if (logoutAttempted.current) return;
    logoutAttempted.current = true;

    const performLogout = async () => {
      const token = getUserKey();
      if (token) {
        try {
          await signOut({ token });
        } catch {
          // Continue logout even if server-side invalidation fails
        }
      }
      clearUserKey();
      router.push("/");
    };

    performLogout();
  }, [router, signOut]);

  return (
    <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Logging out">
      <div className="text-center">Logging out...</div>
    </div>
  );
}
