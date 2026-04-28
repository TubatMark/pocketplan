import "./globals.css";
import { Outfit } from "next/font/google";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });

export const metadata = {
  title: "PocketPlan — Personal finance, simplified",
  description: "Plan your monthly budget, track transactions, and manage debts in one place.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"
        />
      </head>
      <body
        className={cn(
          outfit.className,
          "min-h-screen bg-background text-foreground tracking-[var(--tracking-normal)] antialiased"
        )}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
