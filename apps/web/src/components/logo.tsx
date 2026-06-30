import { cn } from "@/lib/utils";

const SIZES = {
  sm: { box: 26, icon: 15, text: "text-sm" },
  md: { box: 32, icon: 18, text: "text-base" },
  lg: { box: 40, icon: 23, text: "text-lg" },
} as const;

/**
 * ShipFlow mark — a `</>` code glyph in a rounded square. Monochrome and
 * theme-aware: a near-black tile with the canvas colour punched through in
 * light mode, inverting cleanly in dark mode.
 */
export function Logo({
  size = "md",
  withWordmark = true,
  className,
}: {
  size?: keyof typeof SIZES;
  withWordmark?: boolean;
  className?: string;
}) {
  const { box, icon, text } = SIZES[size];
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className="relative inline-flex shrink-0 items-center justify-center rounded-[0.55rem] bg-foreground text-background transition-transform duration-200 group-hover:-translate-y-0.5"
        style={{ width: box, height: box }}
        aria-hidden
      >
        <svg
          width={icon}
          height={icon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m18 16 4-4-4-4" />
          <path d="m6 8-4 4 4 4" />
          <path d="m14.5 4-5 16" />
        </svg>
      </span>
      {withWordmark && (
        <span
          className={cn(
            "font-display font-semibold tracking-tight text-foreground",
            text,
          )}
        >
          ShipFlow
        </span>
      )}
    </span>
  );
}
