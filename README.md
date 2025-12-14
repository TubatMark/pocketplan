# PocketPlan

PocketPlan is a minimal, calm personal finance application designed to help you track your money, set goals, and plan for the future. It focuses on simplicity and clarity, allowing you to manage wallets, transactions, debts, and savings goals in one place.

## Features

### 💰 Wallet Management
- Create and manage multiple wallets (e.g., Cash, Bank, Savings).
- Track balances in real-time.
- Visualize your total net worth.

### 💸 Transaction Tracking
- Log Income, Expenses, and Transfers.
- Categorize transactions for better insights.
- Attach notes to keep track of details.

### 🎯 Goal Setting
- Set financial goals with target amounts and deadlines.
- Automatically calculate required daily, weekly, and monthly savings.
- Track progress visually with progress bars and analytics.

### 🤝 Debt Management
- **Owed To You**: Track money you've lent to others.
- **Owed By You**: Track money you've borrowed.
- **Wallet Integration**: Automatically fund loans from your wallets or deposit borrowed money directly.
- **Payment Tracking**: Log partial or full payments and see remaining balances update instantly.

### 📊 Analytics & Activities
- **Dashboard**: Get a high-level view of your financial health.
- **Activity Log**: See a timeline of all your financial actions (transactions, goal updates, debt changes).
- **Charts**: Visual breakdowns of income, expenses, and savings over time.

### 🤖 AI Planning (Coming Soon)
- Generate personalized financial plans based on your goals and spending habits.

## Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/) (App Router), [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/)
- **Backend & Database**: [Convex](https://www.convex.dev/) (Real-time database & backend functions)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm/yarn

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/pocketplan.git
    cd pocketplan
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Environment Setup:**
    Create a `.env.local` file in the root directory and add your Convex deployment URL:
    ```env
    NEXT_PUBLIC_CONVEX_URL=https://your-convex-deployment-url.convex.cloud
    ```

4.  **Start the Backend:**
    Run the Convex development server in a separate terminal:
    ```bash
    pnpm run convex
    ```

5.  **Start the Frontend:**
    Run the Next.js development server:
    ```bash
    pnpm dev
    ```

6.  **Open the App:**
    Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
pocketplan/
├── app/                  # Next.js App Router pages & layouts
│   ├── activities/       # Activity log page
│   ├── debts/            # Debt management page
│   ├── goals/            # Goal setting & tracking
│   ├── transactions/     # Transaction history
│   ├── wallets/          # Wallet management
│   └── ...
├── components/           # Reusable UI components
│   ├── ui/               # Shadcn UI primitives
│   ├── chart/            # Chart components
│   └── ...
├── convex/               # Convex backend functions & schema
│   ├── schema.ts         # Database schema definition
│   ├── debts.ts          # Debt-related mutations/queries
│   ├── goals.ts          # Goal-related mutations/queries
│   └── ...
├── lib/                  # Utility functions
└── public/               # Static assets
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
