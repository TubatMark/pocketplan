"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  ArrowLeftRight,
  PiggyBank,
  CreditCard,
  CalendarDays,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    icon: PiggyBank,
    title: "Monthly budget calculator",
    description:
      "Enter your income, divide it into Expense / Savings / Others by percent, and break each bucket into the categories you actually spend on.",
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    icon: ArrowLeftRight,
    title: "One-tap transactions",
    description:
      "Spend, earn, or move between wallets in three taps. Categories pull straight from this month's budget.",
    color: "bg-rose-100 text-rose-600",
  },
  {
    icon: Wallet,
    title: "Multiple wallets",
    description:
      "Cash, bank accounts, e-wallets, savings — track every balance in one place and transfer between them.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: CalendarDays,
    title: "Calendar overview",
    description:
      "See every day's income and spending on a clean monthly grid. Click any day to view its transactions.",
    color: "bg-violet-100 text-violet-600",
  },
  {
    icon: CreditCard,
    title: "Debt tracking",
    description:
      "Log money you owe and money owed to you. Payments update wallets and your monthly debt budget.",
    color: "bg-amber-100 text-amber-600",
  },
];

const benefits = [
  "Calculator-style budget with live remaining balance",
  "Notion-style calendar dashboard with monthly KPIs",
  "Each month gets its own budget — copy from last month in one tap",
  "Real-time balances across every wallet",
  "Mobile-first design that fits in your pocket",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(25,165,120,0.06),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(249,115,22,0.05),transparent_50%)]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-20 sm:pt-32 sm:pb-28">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              Personal finance, simplified
            </div>

            <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-foreground sm:text-6xl md:text-7xl">
              Plan your money
              <br />
              <span className="text-[hsl(var(--chart-2))]">month by month</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              PocketPlan turns your monthly income into a clear plan — set a budget,
              log what you spend, and see exactly where your money is going.
            </p>

            <div className="mx-auto mt-10 flex max-w-sm flex-col gap-3 sm:max-w-md sm:flex-row">
              <Button asChild size="lg" className="flex-1">
                <Link href="/sign-up">
                  Get started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="flex-1">
                <Link href="/sign-in">Sign in</Link>
              </Button>
            </div>

            <div className="mx-auto mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Free to use</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>No credit card required</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Five tools, one screen
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Everything you need to plan and track your money — and nothing you don't.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${feature.color} transition-transform group-hover:scale-110`}
                >
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-card-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Built for clarity
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Most finance apps drown you in features. PocketPlan keeps it
                tight — five things that all play together.
              </p>
              <ul className="mt-8 space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    </div>
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-orange-500/10 blur-2xl" />
              <div className="relative rounded-2xl border border-border bg-card p-8 shadow-lg">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Total Balance</span>
                    <span className="text-xs text-emerald-600">+12.5%</span>
                  </div>
                  <div className="text-3xl font-bold text-foreground">₱124,500.00</div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full w-3/4 rounded-full bg-emerald-500" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="rounded-xl bg-rose-50 p-3">
                      <div className="text-xs text-muted-foreground">Expense</div>
                      <div className="font-semibold text-foreground">₱18,400</div>
                    </div>
                    <div className="rounded-xl bg-emerald-50 p-3">
                      <div className="text-xs text-muted-foreground">Savings</div>
                      <div className="font-semibold text-foreground">₱9,000</div>
                    </div>
                    <div className="rounded-xl bg-amber-50 p-3">
                      <div className="text-xs text-muted-foreground">Others</div>
                      <div className="font-semibold text-foreground">₱3,000</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Start planning today
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Take five minutes, set your first month's budget, and see where your money is going.
          </p>
          <div className="mx-auto mt-8 flex max-w-sm flex-col gap-3 sm:max-w-md sm:flex-row">
            <Button asChild size="lg" className="flex-1">
              <Link href="/sign-up">
                Create your account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="flex-1">
              <Link href="/sign-in">Already have an account?</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                P
              </div>
              <span className="font-semibold text-foreground">PocketPlan</span>
            </div>
            <p className="text-sm text-muted-foreground">Your personal finance companion</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
