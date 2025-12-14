// Simplified hook for toast
import { useState, useEffect } from "react";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  className?: string;
};

export function useToast() {
  const toast = (props: ToastProps) => {
    // For now, just log or simple alert. In a real app, this would dispatch to a context.
    console.log("Toast:", props);
  };
  return { toast };
}
