import Image from "next/image";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { box: 22, text: "text-sm" },
  md: { box: 28, text: "text-base" },
  lg: { box: 36, text: "text-lg" },
} as const;

export function Logo({
  size = "md",
  withWordmark = true,
  className,
}: {
  size?: keyof typeof SIZES;
  withWordmark?: boolean;
  className?: string;
}) {
  const { box, text } = SIZES[size];
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className="relative inline-flex shrink-0 items-center justify-center rounded-[0.55rem] bg-white/5 p-1 ring-1 ring-border/60 transition-colors group-hover:ring-accent/60"
        style={{ width: box + 8, height: box + 8 }}
      >
        <Image
          src="/logo.png"
          alt="ShipFlow AI"
          width={box}
          height={box}
          priority
          className="object-contain"
        />
      </span>
      {withWordmark && (
        <span
          className={cn(
            "font-display font-semibold tracking-tight text-foreground",
            text,
          )}
        >
          Ship<span className="text-accent">Flow</span>
        </span>
      )}
    </span>
  );
}
