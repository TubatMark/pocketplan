"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs", className)} {...props} />;
}

