# Frontend Design System

This document serves as the single source of truth for the PocketPlan frontend design system. It outlines the technology stack, core design tokens, layout patterns, and component library usage to ensure consistency across the application.

## 1. Tech Stack Overview

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Component Primitives**: [Radix UI](https://www.radix-ui.com/) (Headless, accessible components)
- **Icons**: Lucide React
- **Utilities**:
  - `clsx` & `tailwind-merge` (via `cn` helper) for dynamic class composition.
  - `class-variance-authority` (CVA) for managing component variants.

## 2. Typography

The application uses the **Outfit** font family from Google Fonts.

- **Font Family**: `Outfit`
- **Variable**: `--font-sans`
- **Implementation**: Applied globally to the `body` in `app/layout.tsx`.
- **Tracking**: Custom tracking variable `--tracking-normal` is applied.

## 3. Color System (Design Tokens)

The color system is built on CSS variables to support theming (Light/Dark mode). All colors are defined in `app/globals.css` and referenced in `tailwind.config.ts`.

### Base Colors
| Token | Description | Tailwind Class |
|-------|-------------|----------------|
| `--background` | Main page background | `bg-background` |
| `--foreground` | Main text color | `text-foreground` |
| `--muted` | Muted backgrounds (e.g., secondary buttons) | `bg-muted` |
| `--muted-foreground` | Muted text (e.g., subtitles) | `text-muted-foreground` |

### Semantic Colors
| Token | Description | Tailwind Class |
|-------|-------------|----------------|
| `--primary` | Primary actions (Deep Teal in Light mode) | `bg-primary` |
| `--destructive` | Error states or destructive actions | `bg-destructive` |
| `--border` | Default border color | `border-border` |
| `--input` | Input field borders | `border-input` |
| `--ring` | Focus ring color | `ring-ring` |

### Dashboard Specific Colors (Pastels)
Custom pastel colors used for Metric Cards and Dashboard elements:
- **Orange**: `hsl(var(--card-orange))` (25 100% 92%)
- **Green**: `hsl(var(--card-green))` (140 60% 92%)
- **Purple**: `hsl(var(--card-purple))` (250 60% 96%)
- **Blue**: `hsl(var(--card-blue))` (210 80% 94%)

### Chart Colors
- **Background**: `hsl(var(--chart-bg))` (Dark Green)
- **Bars**: `hsl(var(--chart-bar))` (Yellowish)

## 4. Layout Patterns

### Dashboard Layout
The dashboard typically consists of a grid of cards and charts.

- **Metric Cards** (`components/ui/metric-card.tsx`):
  - **Structure**:
    - **Header**: Label (left) + Icon (right, rounded background).
    - **Body**: Large Value + Subtext.
  - **Styling**: Uses custom pastel background colors via the `colorVar` prop.
  - **Interactivity**: Optional `onClick` handler with hover shadow effects.

### Table Layout
Tables are built using the `components/ui/table.tsx` component, which wraps standard HTML table elements with accessible and styled components.

- **Wrapper**: `<div className="relative w-full overflow-auto">` ensures tables are responsive.
- **Components**:
  - `Table`: Main container, full width.
  - `TableHeader`: Sticky top header container.
  - `TableRow`: Includes hover states (`hover:bg-muted/50`) and selection states.
  - `TableHead`: Muted text, medium font weight.
  - `TableCell`: Standard padding and alignment.

**Example Usage**:
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Status</TableHead>
      <TableHead>Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell><Badge>Active</Badge></TableCell>
      <TableCell>$250.00</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

## 5. Component Library

All reusable components are located in `components/ui/`. They are built with accessibility (a11y) in mind, often leveraging Radix UI primitives.

### Primitives
- **Button** (`button.tsx`): Supports variants (`default`, `destructive`, `outline`, `secondary`, `ghost`, `link`) and sizes (`default`, `sm`, `lg`, `icon`).
- **Input** (`input.tsx`): Standard text input with focus rings.
- **Select** (`select.tsx`): Accessible dropdown menu.
- **Switch** (`switch.tsx`): Toggle switch for boolean states.
- **Label** (`label.tsx`): Accessible label for form inputs.
- **Textarea** (`textarea.tsx`): Multi-line text input.

### Feedback & Status
- **Badge** (`badge.tsx`): Small status indicators. Variants: `default`, `secondary`, `destructive`, `outline`.
- **Alert** (`alert.tsx`): For displaying important messages (error, warning, info).
- **Progress** (`progress.tsx`): Visual progress bar.
- **Skeleton** (`skeleton.tsx`): Loading placeholder states.
- **Tooltip** (`tooltip.tsx`): Hover information popups.

### Overlays
- **Dialog** (`dialog.tsx`): Modal windows for critical interactions.
- **Sheet** (`sheet.tsx`): Slide-out panels (Top, Bottom, Left, Right). Commonly used for mobile navigation or detailed editing views.

### Data Display
- **Card** (`card.tsx`): Versatile container with `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, and `CardFooter`.
- **Avatar** (`avatar.tsx`): User profile images with fallback initials.

### Utilities
- **DatePicker** (`datepicker.tsx`): Calendar selection input.
- **Tabs** (`tabs.tsx`): Tabbed interface for switching between views.

## 6. Coding Conventions

- **Class Merging**: Always use the `cn()` utility when allowing custom `className` props to ensure Tailwind classes merge correctly without conflicts.
  ```tsx
  className={cn("base-styles", className)}
  ```
- **Accessibility**:
  - Ensure all interactive elements have focus states (`focus-visible:ring`).
  - Use semantic HTML or appropriate ARIA roles (handled largely by Radix UI).
- **Dark Mode**:
  - Use standard tokens (`bg-background`, `text-foreground`) to ensure automatic dark mode compatibility.
  - Avoid hardcoding hex values unless strictly necessary for specific brand elements that don't change.
