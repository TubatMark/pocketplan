import "./globals.css";
import { Outfit } from "next/font/google";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body className={cn(outfit.className, "min-h-screen bg-background text-foreground tracking-[var(--tracking-normal)]")} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
