"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea className={cn("flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm", className)} {...props} />
  );
}

