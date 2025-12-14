# PocketPlan PRD

## Vision
PocketPlan helps individuals track everyday finances with a minimal, calm UI. The product focuses on goals, wallets, and transactions, producing simple analytics that encourage consistent saving.

## Personas
- Budgeting individual who wants quick capture and progress tracking
- New users who prefer frictionless onboarding without accounts

## MVP Scope
- Anonymous local sessions using a `userKey` stored in `localStorage`
- Core features:
  - Wallets: create/list/update/delete with type and balance
  - Goals: create/list with auto-calculated required savings and deadline
  - Transactions: log income/expense/transfer with wallet updates
  - Dashboard & Analytics: month totals, wallet balances, goal progress
- Client-side routing with Next.js App Router; Convex backend for data
- No third-party auth; no multi-device sync

## Non-Goals
- Account management, passwords, social login
- Multi-user collaboration
- Server-rendered Convex queries

## Functional Requirements
- Session
  - Generate `userKey` at first load and persist in `localStorage`
  - Create Convex `users` record automatically from `userKey`
- Wallets
  - Create with `name`, `type`, `balance`; list by user
  - Update fields; delete owned wallets; index by `user_id`
- Goals
  - Create with `slug`, `target_amount`, `target_months`
  - Auto compute `required_*_savings` and `deadline`
  - List by user; progress calculated from transactions net savings
- Transactions
  - Income/Expense: adjust wallet balance (+/-)
  - Transfer: move between two wallets, fail on insufficient funds
  - List recent with filter by date range
- Dashboard/Analytics
  - Month income, expense, net; wallet balances; per-goal progress
  - Basic warnings (overspending, ahead/behind schedule)

## Data Model (Convex)
- `users`: `{ email, name, clerkId, created_at }` where `clerkId` stores `userKey` in MVP
- `wallets`: `{ user_id, slug, name, balance, type, created_at }`
- `goals`: `{ user_id, slug, target_amount, target_months, start_date?, required_*_savings, deadline, created_at }`
- `transactions`: `{ user_id, goal_id?, amount, type, category, wallet_id?, transfer_*_wallet_id?, method?, notes?, created_at }`

Note: In MVP, `users.clerkId` is repurposed for `userKey`. A later refactor will rename it.

## UX Requirements
- Minimal, airy UI; consistent spacing and tokens across pages
- TopNav and Sidebar for navigation; responsive layout
- Clear empty states and neutral loading copy (“Setting up your account…”)

## Security & Privacy
- No secrets in client logs
- Anonymous local sessions only; data scoped to `userKey`
- Avoid exposing any server credentials; follow environment variable best practices

## Success Metrics
- Time to first transaction (<2 minutes)
- Weekly active session using `userKey`
- Number of wallets and goals created per user

## Risks
- Anonymous session is single-device; data loss if local storage cleared
- No server-side auth; any user with the `userKey` could read data if exfiltrated
- Future migration to proper auth requires renaming `clerkId` field

## Future Extensions
- Passkey or email-link auth to sync across devices
- Budgets per category; recurring transactions
- Import/export CSV
- Mobile-first experience and PWA install

