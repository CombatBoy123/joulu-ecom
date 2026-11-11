"use client";

import { useEffect, useRef } from "react";

interface Flake {
  x: number;
  y: number;
  r: number;
  vy: number;
  vx: number;
  sway: number;
  o: number;
}

// A light fall of snow behind the page. Decorative only: it never runs for
// visitors who ask for reduced motion, and it stops while the tab is hidden.
export function Snowfall() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let w = 0;
    let h = 0;
    let flakes: Flake[] = [];
    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const make = (): Flake => {
      const r = Math.random() * 1.8 + 0.6;
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r,
        vy: r * 0.25 + 0.15,
        vx: (Math.random() - 0.5) * 0.3,
        sway: Math.random() * Math.PI * 2,
        o: Math.random() * 0.4 + 0.25,
      };
    };
    const size = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Density follows the width and is capped so it stays subtle.
      flakes = Array.from({ length: Math.min(70, Math.round(w / 18)) }, make);
    };
    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      for (const f of flakes) {
        f.sway += 0.01;
        f.y += f.vy;
        f.x += f.vx + Math.sin(f.sway) * 0.3;
        if (f.y > h + 5) {
          f.y = -5;
          f.x = Math.random() * w;
        }
        if (f.x > w + 5) f.x = -5;
        if (f.x < -5) f.x = w + 5;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(241, 229, 213, ${f.o})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    };
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(frame);
    };

    size();
    raf = requestAnimationFrame(frame);
    window.addEventListener("resize", size);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={ref} className="snowfall" aria-hidden="true" />;
}
