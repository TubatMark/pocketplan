/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activities from "../activities.js";
import type * as admin from "../admin.js";
import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as backup from "../backup.js";
import type * as backup_data from "../backup_data.js";
import type * as crons from "../crons.js";
import type * as debts from "../debts.js";
import type * as debug from "../debug.js";
import type * as goals from "../goals.js";
import type * as plans from "../plans.js";
import type * as security from "../security.js";
import type * as traffic from "../traffic.js";
import type * as transactions from "../transactions.js";
import type * as users from "../users.js";
import type * as wallets from "../wallets.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activities: typeof activities;
  admin: typeof admin;
  analytics: typeof analytics;
  auth: typeof auth;
  backup: typeof backup;
  backup_data: typeof backup_data;
  crons: typeof crons;
  debts: typeof debts;
  debug: typeof debug;
  goals: typeof goals;
  plans: typeof plans;
  security: typeof security;
  traffic: typeof traffic;
  transactions: typeof transactions;
  users: typeof users;
  wallets: typeof wallets;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
