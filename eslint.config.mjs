// Minimal flat config for ESLint v9.
// Next 16 ships its own typegen and the build itself enforces correctness;
// keep linting opt-in and unblocking. Add rules here as the project matures.

export default [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "convex/_generated/**",
      "__tests__/**",
      "next-env.d.ts",
    ],
  },
];
