"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getPasswordStrength,
  PASSWORD_RULES,
  type PasswordStrength,
} from "@/lib/auth-validation";

const LEVEL_META: Record<
  PasswordStrength["level"],
  { label: string; bar: string; text: string }
> = {
  empty: { label: "", bar: "bg-muted", text: "text-muted-foreground" },
  weak: { label: "Weak", bar: "bg-destructive", text: "text-destructive" },
  fair: { label: "Fair", bar: "bg-amber-500", text: "text-amber-600" },
  good: { label: "Good", bar: "bg-lime-500", text: "text-lime-600" },
  strong: { label: "Strong", bar: "bg-emerald-500", text: "text-emerald-600" },
};

export function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = getPasswordStrength(password);
  const meta = LEVEL_META[strength.level];
  const segments = PASSWORD_RULES.length;
  const filled = strength.score;

  if (!password) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1" aria-hidden="true">
          {Array.from({ length: segments }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i < filled ? meta.bar : "bg-muted",
              )}
            />
          ))}
        </div>
        {meta.label && (
          <span className={cn("text-xs font-medium", meta.text)}>
            {meta.label}
          </span>
        )}
      </div>
      <ul className="flex flex-col gap-1">
        {strength.results.map((r) => (
          <li
            key={r.id}
            className={cn(
              "flex items-center gap-1.5 text-xs",
              r.passed ? "text-emerald-600" : "text-muted-foreground",
            )}
          >
            {r.passed ? (
              <Check className="size-3.5 shrink-0" />
            ) : (
              <X className="size-3.5 shrink-0" />
            )}
            {r.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
