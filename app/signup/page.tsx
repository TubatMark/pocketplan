"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redirect page for backwards compatibility.
 * Redirects /signup to /sign-up
 */
export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/sign-up");
  }, [router]);

  return null;
}
