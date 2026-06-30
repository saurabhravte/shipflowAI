import { Info, AlertTriangle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

export function DocHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="mb-10 border-b border-border/60 pb-8">
      <p className="font-data text-xs uppercase tracking-widest text-accent">
        {eyebrow}
      </p>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        {description}
      </p>
    </header>
  );
}

export function DocSection({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 py-6">
      <h2 className="font-display text-2xl font-semibold tracking-tight">
        {title}
      </h2>
      <div className="mt-4 flex flex-col gap-4 text-[0.95rem] leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-[var(--radius-lg)] border border-border/70 bg-background/80 p-4 font-data text-xs leading-relaxed text-foreground/90">
      <code>{children}</code>
    </pre>
  );
}

const CALLOUT_STYLES = {
  info: { icon: Info, cls: "border-brand-blue/30 bg-brand-blue/10 text-foreground" },
  tip: { icon: Lightbulb, cls: "border-success/30 bg-success/10 text-foreground" },
  warning: {
    icon: AlertTriangle,
    cls: "border-warning/40 bg-warning/10 text-foreground",
  },
} as const;

export function Callout({
  type = "info",
  title,
  children,
}: {
  type?: keyof typeof CALLOUT_STYLES;
  title?: string;
  children: React.ReactNode;
}) {
  const { icon: Icon, cls } = CALLOUT_STYLES[type];
  return (
    <div
      className={cn(
        "flex gap-3 rounded-[var(--radius-lg)] border p-4 text-sm leading-relaxed",
        cls,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0 text-accent" />
      <div className="flex flex-col gap-1">
        {title && <p className="font-display font-semibold">{title}</p>}
        <div className="text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

export function Steps({
  items,
}: {
  items: { title: string; body: React.ReactNode }[];
}) {
  return (
    <ol className="flex flex-col gap-4">
      {items.map((item, i) => (
        <li
          key={item.title}
          className="card-hover flex gap-4 rounded-[var(--radius-xl)] border border-border/70 bg-card/50 p-5"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
            {i + 1}
          </span>
          <div className="flex flex-col gap-1.5">
            <h3 className="font-display text-base font-semibold text-foreground">
              {item.title}
            </h3>
            <div className="text-sm leading-relaxed text-muted-foreground">
              {item.body}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
