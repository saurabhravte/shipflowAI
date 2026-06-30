"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Animated canvas particle field masked behind display text — inspired by
 * Aceternity canvas-text, implemented without Three.js for a lighter bundle.
 */
export function CanvasText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;

    const particles = Array.from({ length: 48 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0008,
      vy: (Math.random() - 0.5) * 0.0008,
      r: 0.8 + Math.random() * 1.6,
    }));

    function resize() {
      if (!canvas || !ctx || !wrap) return;
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
      w = Math.max(rect.width, 1);
      h = Math.max(rect.height, 1);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(t: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      const accent =
        getComputedStyle(wrap!).getPropertyValue("--accent").trim() ||
        "oklch(0.58 0.18 245)";

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > 1) p.vx *= -1;
        if (p.y < 0 || p.y > 1) p.vy *= -1;

        const px = p.x * w;
        const py = p.y * h;
        const pulse = 0.55 + 0.45 * Math.sin(t * 0.002 + p.x * 12);

        ctx.beginPath();
        ctx.arc(px, py, p.r * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `color-mix(in oklch, ${accent} ${Math.floor(35 + pulse * 40)}%, transparent)`;
        ctx.fill();
      }

      // Soft connecting lines
      ctx.strokeStyle = `color-mix(in oklch, ${accent} 18%, transparent)`;
      ctx.lineWidth = 0.6;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i]!;
          const b = particles[j]!;
          const dx = (a.x - b.x) * w;
          const dy = (a.y - b.y) * h;
          if (dx * dx + dy * dy < 3600) {
            ctx.beginPath();
            ctx.moveTo(a.x * w, a.y * h);
            ctx.lineTo(b.x * w, b.y * h);
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(draw);
    }

    resize();
    raf = requestAnimationFrame(draw);
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <span ref={wrapRef} className={cn("relative inline-block font-display font-bold", className)}>
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-90"
      />
      <span
        className="relative z-10 bg-clip-text text-transparent"
        style={{
          backgroundImage:
            "linear-gradient(135deg, var(--accent) 0%, color-mix(in oklch, var(--accent) 70%, var(--foreground)) 50%, var(--accent) 100%)",
          backgroundSize: "200% 200%",
          animation: "canvas-text-shimmer 6s ease infinite",
          WebkitBackgroundClip: "text",
        }}
      >
        {children}
      </span>
    </span>
  );
}
