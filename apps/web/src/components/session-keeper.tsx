"use client";

import { useSession } from "@/lib/auth-client";

/** Keeps the auth session warm while the app is open. */
export function SessionKeeper() {
  useSession();
  return null;
}
