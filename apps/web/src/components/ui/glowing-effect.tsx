"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Subtle card surface with a clean, calm hover state.
 *
 * Previously this rendered a pointer-following radial "glow" that tracked the
 * mouse across the card. That effect was distracting and hurt readability, so
 * it has been removed in favour of a quiet border + elevation change on hover.
 * The component name is kept so existing call sites don't need to change.
 */
export function GlowingEffect({
  children,
  className,
  disabled = false,
}: {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <div className={cn("group/glow relative rounded-[inherit]", className)}>
      <div
        className={cn(
          "relative h-full rounded-[inherit] border border-border bg-card transition-colors duration-200",
          !disabled &&
            "hover:border-border/80 hover:bg-card/80 focus-within:border-accent/50",
        )}
      >
        {children}
      </div>
    </div>
  );
}
