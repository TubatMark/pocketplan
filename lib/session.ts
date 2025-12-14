"use client";
import { useEffect, useState } from "react";

// Now manages the session token, not an anonymous key
export function getUserKey(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("pp_session_token") || "";
}

export function setUserKey(token: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("pp_session_token", token);
    // Dispatch event to update hooks across tabs/components if needed
    window.dispatchEvent(new Event("storage"));
  }
}

export function clearUserKey() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("pp_session_token");
    window.dispatchEvent(new Event("storage"));
  }
}

export function useUserKey(): string {
  const [key, setKey] = useState<string>("");

  useEffect(() => {
    // Initial load
    setKey(getUserKey());

    // Listen for storage changes (login/logout)
    const handleStorage = () => setKey(getUserKey());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return key;
}
