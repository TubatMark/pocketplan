"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost";
  size?: "icon" | "sm" | "md" | "lg";
  asChild?: boolean;
}

export function Button({ className, variant = "default", size = "md", asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  const base = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<string, string> = {
    default: "bg-primary text-primary-foreground hover:opacity-90",
    secondary: "bg-secondary text-secondary-foreground hover:opacity-90",
    destructive: "bg-destructive text-destructive-foreground hover:opacity-90",
    outline: "border border-border hover:bg-muted",
    ghost: "hover:bg-muted",
  };
  const sizes: Record<string, string> = {
    icon: "h-10 w-10",
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4",
    lg: "h-11 px-6 text-lg",
  };
  return (
    <Comp className={cn(base, variants[variant], sizes[size], className)} {...props} />
  );
}

