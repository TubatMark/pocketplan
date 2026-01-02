# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PocketPlan is a personal finance application built with Next.js 16 (App Router) and Convex as the backend/database. It uses a custom session-based authentication system with localStorage, not Convex's built-in auth.

## Development Commands

```bash
# Install dependencies
pnpm install

# Start Convex backend (run in separate terminal)
pnpm convex

# Start Next.js frontend
pnpm dev

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Production build
pnpm build

# Seed initial admin user
npx convex run admin:seedAdmin
# Default credentials: admin@admin.com / admin123
```

## Architecture

### Backend: Convex Functions

All backend logic lives in `/convex/`. Unlike traditional REST APIs, Convex uses functions that are called directly from the frontend:

- **Queries** (`queryGeneric`): Read-only operations, reactively update the UI when data changes
- **Mutations** (`mutationGeneric`): Write operations that modify the database

Key files:
- `schema.ts` - Database schema with all tables and indexes
- `auth.ts` - Sign up/in/out, token validation
- `wallets.ts` - Wallet CRUD operations
- `transactions.ts` - Transaction management with validation
- `goals.ts` - Goal tracking and progress
- `debts.ts` - Debt management (owed to you vs owed by you)
- `analytics.ts` - Financial calculations and caching
- `admin.ts` - Admin dashboard operations
- `messages.ts` - User-admin messaging system

### Frontend: Next.js App Router

- `/app/` - Routes and pages
  - `admin/` - Admin dashboard (protected by AdminGuard)
  - `activities/`, `debts/`, `goals/`, `transactions/`, `wallets/` - Feature pages
- `/components/` - React components
  - `ui/` - Shadcn UI primitives (button, card, dialog, etc.)
  - `admin/` - Admin-specific components
  - `chart/` - Recharts components

### Authentication Pattern

Uses custom session tokens stored in localStorage:
1. User signs in → `auth.ts:signIn` generates a token
2. Token stored in localStorage via `useUserKey` hook
3. Token validated on each request via `auth.ts:validateToken`
4. Sessions expire after 30 days

Protected routes use the `AdminGuard` component for admin areas.

### Key Data Models

- **users**: name, email, password (hashed), role (admin/regular)
- **sessions**: token-based auth with expiration
- **wallets**: user_id, name, type (Cash/Bank/Savings), balance
- **transactions**: amount, type (income/expense/transfer/savings/debt_payment), category, optional goal_id/debt_id
- **goals**: target_amount, target_months, calculated required savings (daily/weekly/monthly)
- **debts**: type (owed_to_you/owed_by_you), total_amount, remaining_amount
- **activities**: Audit log of all financial actions
- **analytics_cache**: Precomputed analytics for performance
- **messages**: Threaded admin-user messaging

### Transaction Type Relationships

- `savings` transactions must reference a `goal_id`
- `debt_payment` transactions must reference a `debt_id`
- `transfer` transactions have both `transfer_from_wallet_id` and `transfer_to_wallet_id`
- Savings transactions use `wallet_id` and `goal_id` to track where money came from and which goal it contributes to

### UI Components

Uses Shadcn UI with Radix UI primitives and Tailwind CSS:
- Components in `components/ui/` are pre-built Shadcn components
- Custom components in `components/` follow the same patterns
- Dark mode support via CSS variables
- Mobile-first responsive design with bottom navigation

### Path Aliases

`@/` maps to the project root (configured in `tsconfig.json`)

### Styling Conventions

- Use `cn()` utility from `lib/utils.ts` for conditional class merging
- Tailwind classes follow the project's custom color scheme
- Font: Outfit (Google Font), set as `--font-sans` CSS variable
