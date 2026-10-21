import { useEffect, useRef } from "react";

export function Platter({ rpm, label, playing }: { rpm: number; label: string; playing: boolean }) {
  const disc = useRef<HTMLDivElement>(null);
  const angle = useRef(0);
  const last = useRef<number | null>(null);

  useEffect(() => {
    const node = disc.current;
    if (!node) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    let frame = 0;
    const loop = (now: number) => {
      if (last.current == null) last.current = now;
      const dt = (now - last.current) / 1000;
      last.current = now;
      if (playing) {
        angle.current = (angle.current + (rpm / 60) * 360 * dt) % 360;
        node.style.transform = `rotate(${angle.current}deg)`;
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      last.current = null;
    };
  }, [playing, rpm]);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-72">
      <div ref={disc} className="platter-face absolute inset-0 rounded-full border border-border" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 z-10 flex size-1/2 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-label text-ink">
        <span className="font-display text-2xl leading-none tracking-tight">{label}</span>
        <span className="mt-1 font-mono text-xs tracking-wide">RPM</span>
        <span className="mt-2 size-2 rounded-full bg-ink" />
      </div>
    </div>
  );
}
