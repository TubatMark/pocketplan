# PocketPlan UI & Frontend Design System

This document describes the frontend architecture, design system, and UI patterns used in PocketPlan. It serves as a reference for maintaining consistency across the application and for future projects.

## 1. Tech Stack

*   **Framework**: [Next.js](https://nextjs.org/) (App Router)
*   **Language**: TypeScript
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Component Primitives**: [Radix UI](https://www.radix-ui.com/) (Headless, accessible components)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Fonts**: [Outfit](https://fonts.google.com/specimen/Outfit) (via `next/font/google`)
*   **State Management**: React Hooks + [Convex](https://convex.dev/) (Real-time database & backend)
*   **Utility**: `clsx` and `tailwind-merge` (via `cn` helper) for dynamic class composition.

## 2. Design Tokens & Theme

The project uses CSS variables for theming, enabling easy customization and dark mode support.

### Colors
Defined in `globals.css` and `tailwind.config.ts`.

*   **Primary**: Brand color (Indigo/Blue tones). Used for primary buttons, active states, and highlights.
    *   `bg-primary`, `text-primary-foreground`
*   **Secondary**: Muted accent color.
    *   `bg-secondary`, `text-secondary-foreground`
*   **Destructive**: Error/Danger actions (Red).
    *   `bg-destructive`, `text-destructive-foreground`
*   **Muted**: Subtle backgrounds and de-emphasized text.
    *   `bg-muted`, `text-muted-foreground`
*   **Background/Foreground**: Base page background and text color.
    *   `bg-background`, `text-foreground`
*   **Card/Popover**: Surface colors for containers.
    *   `bg-card`, `text-card-foreground`
*   **Border/Input/Ring**: Functional colors for form elements and dividers.

### Typography
*   **Font Family**: `Outfit` (Sans-serif).
*   **Scale**: Standard Tailwind scale.
    *   Headings: `text-3xl font-bold tracking-tight`
    *   Subheadings: `text-lg font-semibold`
    *   Body: `text-base` or `text-sm`
    *   Muted Text: `text-sm text-muted-foreground`

### Spacing & Layout
*   **Container**: `max-w-7xl` centered for main content.
*   **Padding**: Consistent usage of `p-4` (mobile) and `p-8` (desktop).
*   **Radius**: `rounded-lg` (0.5rem) for cards and inputs, `rounded-md` for buttons.

## 3. Core Components

Reusables located in `components/ui/`.

### Layout Components
*   **DashboardShell**: Wraps the main authenticated view.
    *   **Sidebar**: Fixed vertical nav (`md:pl-64`), hidden on mobile.
    *   **Header**: Sticky top bar.
    *   **MobileBottomNav**: Fixed bottom bar for mobile navigation.
*   **Card**: Container for grouping related content.
    *   Composition: `Card` → `CardHeader` (Title/Description) → `CardContent` → `CardFooter`.

### Interactive Elements
*   **Button**:
    *   Variants: `default`, `secondary`, `destructive`, `outline`, `ghost`.
    *   Sizes: `sm`, `md` (default), `lg`.
    *   States: `hover:opacity-90`, `disabled:opacity-50`.
*   **Switch**: Toggle for boolean settings.
    *   States: Checked (Primary), Unchecked (Input color), Disabled.
*   **Input / Select**: Standard form fields with `ring` focus states.

### Feedback & Overlays
*   **Dialog (Modal)**: Accessible modal for complex interactions.
    *   Features: Backdrop blur, centered content, accessible focus management.
*   **Toast**: Non-intrusive notifications (Success/Error).
    *   Contextual styling (Green for success, Red for error).
*   **Skeleton**: Pulse animation for loading states.
    *   Used to prevent layout shifts during data fetching.

## 4. UI Patterns & UX

### Optimistic UI
*   **Immediate Feedback**: UI updates immediately upon user interaction (e.g., toggling a switch) while the backend request processes.
*   **Loading States**:
    *   **Specific**: `toggling` state per item prevents interaction blocking.
    *   **Visuals**: `opacity-50`, `cursor-wait`, and spinners (`Loader2` animate-spin).

### Responsive Design
*   **Mobile-First**: Layouts adapt from single column (`grid-cols-1`) to multi-column (`md:grid-cols-2`).
*   **Navigation**: Sidebar on desktop vs. Bottom Nav on mobile ensures accessibility on all devices.

### Data Display
*   **Empty States**: Clear messaging when no data is available.
*   **Loading Skeletons**: Mirrors the actual content shape (Circle for icons, Bars for text) rather than generic spinners.

## 5. File Structure Reference

```
/app
  layout.tsx        # Root layout with Fonts & Providers
  globals.css       # CSS Variables & Tailwind directives
  /(dashboard)      # Protected routes
/components
  /ui               # Generic, reusable primitives (Button, Card, etc.)
  dashboard-shell.tsx # Main layout wrapper
  sidebar.tsx       # Desktop navigation
  ...
/lib
  utils.ts          # cn() helper for class merging
```

## 6. Iconography
*   **Library**: Lucide React
*   **Usage**:
    *   **Navigation**: Simple, recognizable icons (CreditCard, Target, Activity).
    *   **Actions**: Edit (Pencil), Delete (Trash), Save (Save).
    *   **Status**: CheckCircle (Success), AlertTriangle (Error), Loader2 (Loading).
*   **Style**: Consistent stroke width, typically `h-4 w-4` or `h-5 w-5`.
