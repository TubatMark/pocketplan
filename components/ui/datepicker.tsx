"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export function DatePicker({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="date"
      className={cn(
        "h-10 w-full rounded-md bg-[var(--input)] border border-[var(--border)] px-3 text-sm",
        className
      )}
      {...props}
    />
  );
}

