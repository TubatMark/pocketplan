"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { getUserKey, clearUserKey } from "@/lib/session";

export default function LogoutPage() {
  const router = useRouter();
  const signOut = useMutation("auth:signOut" as any);

  useEffect(() => {
    const token = getUserKey();
    if (token) {
      signOut({ token }).catch(console.error);
    }
    clearUserKey();
    router.push("/");
  }, [router, signOut]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">Logging out...</div>
    </div>
  );
}
