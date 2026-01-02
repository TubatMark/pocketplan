"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redirect page for backwards compatibility.
 * Redirects /login to /sign-in
 */
export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/sign-in");
  }, [router]);

  return null;
}
