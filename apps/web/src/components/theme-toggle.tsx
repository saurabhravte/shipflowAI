"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className={cn(
          "flex h-9 items-center rounded-lg border border-border/70 bg-muted/50 p-0.5",
          className,
        )}
        aria-hidden
      >
        <span className="size-8" />
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <div
      className={cn(
        "flex items-center rounded-lg border border-border/70 bg-muted/40 p-0.5",
        className,
      )}
      role="group"
      aria-label="Theme"
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-md transition-all duration-150",
          !isDark
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
        aria-label="Light mode"
        aria-pressed={!isDark}
      >
        <Sun className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-md transition-all duration-150",
          isDark
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
        aria-label="Dark mode"
        aria-pressed={isDark}
      >
        <Moon className="size-4" />
      </button>
    </div>
  );
}
