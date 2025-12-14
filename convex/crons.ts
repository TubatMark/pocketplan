import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Daily Incremental Backup at 2:00 AM UTC
crons.daily(
  "daily-backup",
  { hourUTC: 2, minuteUTC: 0 },
  api.backup.perform,
  { type: "daily" }
);

// Weekly Full Backup at 3:00 AM UTC on Sundays
crons.weekly(
  "weekly-backup",
  { dayOfWeek: "sunday", hourUTC: 3, minuteUTC: 0 },
  api.backup.perform,
  { type: "weekly" }
);

export default crons;
