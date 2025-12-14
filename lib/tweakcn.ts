import { cn } from "./utils";

export function tcn(...classes: (string | false | null | undefined)[]) {
  return cn(classes.filter(Boolean) as string[]);
}

