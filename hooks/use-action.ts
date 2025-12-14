"use client";

import { useConvex } from "convex/react";
import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";

interface UseActionResult<T, A> {
  mutate: (args: A) => Promise<T | undefined>;
  isLoading: boolean;
  error: Error | null;
  reset: () => void;
}

export function useAction<T = any, A = any>(
  op: any,
  options: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    successMessage?: string;
    type?: "mutation" | "action";
  } = {}
): UseActionResult<T, A> {
  const convex = useConvex();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const mutate = useCallback(async (args: A) => {
    setIsLoading(true);
    setError(null);
    try {
      let result;
      if (options.type === "action") {
        result = await convex.action(op, args);
      } else {
        result = await convex.mutation(op, args);
      }
      options.onSuccess?.(result);
      return result;
    } catch (err: any) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      options.onError?.(errorObj);
      console.error("Action failed:", errorObj);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, [convex, op, options]);

  return {
    mutate,
    isLoading,
    error,
    reset: () => setError(null),
  };
}
