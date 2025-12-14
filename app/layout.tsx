import "./globals.css";
import { Outfit } from "next/font/google";
import { ReactNode, Suspense } from "react";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";
import { TrafficTracker } from "@/components/traffic-tracker";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body className={cn(outfit.className, "min-h-screen bg-background text-foreground tracking-[var(--tracking-normal)]")} suppressHydrationWarning>
        <Providers>
          <Suspense fallback={null}>
            <TrafficTracker />
          </Suspense>
          {children}
        </Providers>
      </body>
    </html>
  );
}
