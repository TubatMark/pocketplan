"use client";

import { useConvex } from "convex/react";
import { useState, useEffect, useCallback, useRef } from "react";

interface UseDataOptions<T> {
  skip?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  refreshInterval?: number;
}

interface UseDataResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useData<T>(
  query: any, 
  args: any = {}, 
  options: UseDataOptions<T> = {}
): UseDataResult<T> {
  const convex = useConvex();
  const [data, setData] = useState<T | undefined>(undefined);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Use refs to avoid effect loops
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const fetchData = useCallback(async (isBackground = false) => {
    if (optionsRef.current.skip) return;

    if (!isBackground) {
      setStatus("loading");
    } else {
      setIsRefreshing(true);
    }

    try {
      const result = await convex.query(query, args);
      setData(result);
      setStatus("success");
      setError(null);
      optionsRef.current.onSuccess?.(result);
    } catch (err: any) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      setStatus("error");
      optionsRef.current.onError?.(errorObj);
    } finally {
      if (!isBackground) {
        // Keep "success" or "error" state
      } else {
        setIsRefreshing(false);
      }
    }
  }, [convex, query, JSON.stringify(args)]);

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  useEffect(() => {
    if (options.refreshInterval && !options.skip) {
      const interval = setInterval(() => {
        fetchData(true);
      }, options.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, options.refreshInterval, options.skip]);

  return {
    data,
    isLoading: status === "loading" || status === "idle", // Initial load
    isRefreshing,
    error,
    refresh: () => fetchData(true),
  };
}
