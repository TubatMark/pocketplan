# PocketPlan Project Plan

## Architecture
- Frontend: Next.js (App Router), React 18, Tailwind tokens with custom components
- Backend: Convex (queries/mutations), realtime client
- Session: `userKey` via `localStorage`, passed to Convex for scoping

## Key Modules
- `lib/session.ts`: `getUserKey`, `useUserKey` utilities
- `components/providers.tsx`: Wraps app with `ConvexProvider` and auto `users:ensureUser`
- Convex functions: `users`, `wallets`, `goals`, `transactions`, `analytics`
- Pages: `Dashboard`, `Goal`, `Transactions`, `Wallets`, `Analytics`, `Settings`

## Development Workflow
- Package manager: `pnpm`
- Commands:
  - `pnpm install`
  - `pnpm run convex` (backend dev)
  - `pnpm dev` (web dev)
  - `pnpm run typecheck`, `pnpm run lint`

## Data Model Notes
- MVP uses `users.clerkId` field to store `userKey`. Plan a refactor to rename to `userKey` and update indexes (`by_userKey`).

## Phase Plan
1. MVP (current)
   - Anonymous session; wallets/goals/transactions; dashboard analytics
   - Stabilize UI loading states and empty states
2. Quality
   - Validation on all mutations; toast feedback; optimistic updates
   - Export/import CSV; category presets
3. Sync & Auth
   - Introduce passkey/email-link auth
   - Migrate `userKey` records to new identity; rename `clerkId` to `userKey`
4. Advanced Analytics
   - Trends, budget projections, alerts, goal timelines

## Testing Strategy
- Unit tests for Convex mutations (wallet updates, transfers, progress math)
- Integration tests for key flows with Playwright (later phase)
- Mock localStorage for session in tests

## CI/CD
- GitHub Actions: typecheck, lint
- Convex dev for staging; deploy via `pnpm dlx convex deploy`

## Risks & Mitigations
- Single-device sessions: communicate clearly; plan for sync phase
- Data migrations: script to map `clerkId` → `userKey`
- Performance: index usage verified; avoid heavy client loops; paginate long lists

