function barsOf(peaks: number[], count: number): number[] {
  if (peaks.length === 0) return [];
  if (peaks.length <= count) return peaks;
  const out: number[] = [];
  const bucket = peaks.length / count;
  for (let i = 0; i < count; i++) {
    const start = Math.floor(i * bucket);
    const end = Math.max(start + 1, Math.floor((i + 1) * bucket));
    let peak = 0;
    for (let j = start; j < end && j < peaks.length; j++) {
      const value = peaks[j] ?? 0;
      if (value > peak) peak = value;
    }
    out.push(peak);
  }
  return out;
}

export function Waveform({
  peaks,
  progress,
  onSeek,
}: {
  peaks: number[];
  progress: number;
  onSeek: (ratio: number) => void;
}) {
  const bars = barsOf(peaks, 140);
  const seek = (clientX: number, width: number, left: number) => {
    if (width <= 0) return;
    onSeek(Math.min(1, Math.max(0, (clientX - left) / width)));
  };

  return (
    <div
      className="relative h-24 w-full cursor-pointer touch-none"
      onPointerDown={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        seek(event.clientX, rect.width, rect.left);
      }}
      role="slider"
      aria-label="Groove position"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") onSeek(Math.min(1, progress + 0.02));
        if (event.key === "ArrowLeft") onSeek(Math.max(0, progress - 0.02));
      }}
    >
      <div className="flex h-full items-center gap-px" aria-hidden="true">
        {bars.length === 0 ? (
          <div className="h-px w-full bg-border" />
        ) : (
          bars.map((peak, index) => (
            <span
              key={index}
              className="block min-w-0 flex-1 rounded-sm bg-label"
              style={{ height: `${Math.max(6, Math.min(100, peak * 100))}%` }}
            />
          ))
        )}
      </div>
      <div
        className="pointer-events-none absolute top-0 bottom-0 w-px bg-fg"
        style={{ left: `${Math.min(100, Math.max(0, progress * 100))}%` }}
      />
    </div>
  );
}
