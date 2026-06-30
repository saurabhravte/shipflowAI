"use client";

import { useRef, useState, type ReactNode, type MouseEvent } from "react";
import { cn } from "@/lib/utils";

/**
 * Aceternity-inspired border glow that follows the pointer on hover.
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
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  function onMove(e: MouseEvent<HTMLDivElement>) {
    if (disabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ref.current.style.setProperty("--glow-x", `${x}px`);
    ref.current.style.setProperty("--glow-y", `${y}px`);
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      className={cn(
        "group/glow relative rounded-[inherit]",
        !disabled && "transition-transform duration-300 hover:-translate-y-0.5",
        className,
      )}
      style={
        {
          "--glow-x": "50%",
          "--glow-y": "50%",
        } as React.CSSProperties
      }
    >
      {!disabled && (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition-opacity duration-300",
            active && "opacity-100",
          )}
          style={{
            background: `radial-gradient(600px circle at var(--glow-x) var(--glow-y), color-mix(in oklch, var(--accent) 45%, transparent), transparent 40%)`,
          }}
        />
      )}
      <div
        className={cn(
          "relative h-full rounded-[inherit] border border-border/70 bg-card/60 transition-shadow duration-300",
          !disabled &&
            active &&
            "border-accent/40 shadow-[0_0_40px_-12px_color-mix(in_oklch,var(--accent)_55%,transparent)]",
        )}
      >
        {children}
      </div>
    </div>
  );
}
