"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

export function UserAvatar({
  name,
  imageUrl,
  size = "md",
  className,
}: {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = { sm: 28, md: 36, lg: 56 } as const;
  const px = sizes[size];
  const initial = (name?.trim()?.[0] ?? "?").toUpperCase();

  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={name}
        width={px}
        height={px}
        className={cn("rounded-full object-cover ring-1 ring-border", className)}
        unoptimized
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-foreground ring-1 ring-border",
        size === "sm" && "size-7 text-xs",
        size === "md" && "size-9 text-sm",
        size === "lg" && "size-14 text-xl",
        className,
      )}
      aria-hidden={!name}
    >
      {initial}
    </span>
  );
}
