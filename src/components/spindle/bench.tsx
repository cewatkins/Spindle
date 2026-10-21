import { Link } from "@tanstack/react-router";
import * as Slider from "@radix-ui/react-slider";
import { Pause, Play, Square } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Platter } from "@/components/spindle/platter";
import { Waveform } from "@/components/spindle/waveform";
import {
  PARAMETERS,
  RPM_33_1_3,
  RPM_33_50,
  RPM_MAX,
  RPM_MIN,
  describeSpeed,
} from "@/dsp/vinylSpeed";
import kernelSource from "@/dsp/vinylSpeed.ts?raw";
import {
  bounce,
  getServerSnapshot,
  getSnapshot,
  isReady,
  loadFile,
  loadLacquer,
  seekRatio,
  setReadRate,
  setVolume,
  sourceTime,
  stopTransport,
  subscribe,
  togglePlay,
} from "@/lib/session";

const PRESETS = [
  {
    id: "hear",
    label: "Hear 33⅓",
    detail: "Cut at 33.50, played at 33⅓",
    cut: RPM_33_50,
    play: RPM_33_1_3,
  },
  {
    id: "restore",
    label: "Restore",
    detail: "Captured at 33.50, back to 33⅓",
    cut: RPM_33_1_3,
    play: RPM_33_50,
  },
  {
    id: "locked",
    label: "Locked",
    detail: "Both at 33⅓. The file, untouched",
    cut: RPM_33_1_3,
    play: RPM_33_1_3,
  },
] as const;

function near(a: number, b: number) {
  return Math.abs(a - b) < 1e-9;
}

function formatRpm(rpm: number): string {
  if (near(rpm, RPM_33_1_3)) return "33⅓";
  if (near(rpm, RPM_33_50)) return "33.50";
  return rpm.toFixed(2);
}

function formatRate(rate: number): string {
  if (near(rate, 200 / 201)) return "200/201";
  if (near(rate, 201 / 200)) return "201/200";
  if (near(rate, 1)) return "1/1";
  return rate.toFixed(6);
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const whole = Math.floor(seconds);
  const minutes = Math.floor(whole / 60);
  const remain = whole % 60;
  return `${minutes}:${remain.toString().padStart(2, "0")}`;
}

function formatSigned(value: number, digits: number, suffix: string): string {
  const body = Math.abs(value).toFixed(digits);
  if (value > 0) return `+${body}${suffix}`;
  if (value < 0) return `−${body}${suffix}`;
  return `${body}${suffix}`;
}

function downloadText(text: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadBytes(bytes: Uint8Array, filename: string) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const url = URL.createObjectURL(new Blob([copy], { type: "audio/wav" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function exportBase(name: string) {
  const stripped = name.replace(/\.[^.]+$/, "").replace(/[^\w.-]+/g, "_");
  return stripped || "spindle";
}

function RpmControl({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}) {
  const clamp = (next: number) => Math.min(max, Math.max(min, Math.round(next * 100) / 100));
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-sm text-muted">{label}</span>
        <span className="font-mono text-sm tabular-nums text-fg">{formatRpm(value)}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="h-11 w-11 shrink-0 rounded-full border border-border text-fg"
          onClick={() => onChange(clamp(value - 0.01))}
          aria-label={`${label} down one hundredth`}
        >
          −
        </button>
        <Slider.Root
          className="relative flex h-11 min-w-0 flex-1 touch-none items-center"
          min={min}
          max={max}
          step={0.01}
          value={[value]}
          aria-valuetext={formatRpm(value)}
          onValueChange={(next) => {
            const rpm = next[0];
            if (rpm !== undefined) onChange(rpm);
          }}
          aria-label={label}
        >
          <Slider.Track className="relative h-px grow bg-border">
            <Slider.Range className="absolute h-px bg-fg" />
          </Slider.Track>
          <Slider.Thumb className="block size-4 rounded-full border border-ink bg-label" />
        </Slider.Root>
        <button
          type="button"
          className="h-11 w-11 shrink-0 rounded-full border border-border text-fg"
          onClick={() => onChange(clamp(value + 0.01))}
          aria-label={`${label} up one hundredth`}
        >
          +
        </button>
      </div>
    </div>
  );
}

function Groove({
  peaks,
  sampleRate,
  frames,
  readRate,
}: {
  peaks: number[];
  sampleRate: number;
  frames: number;
  readRate: number;
}) {
  const [source, setSource] = useState(0);
  useEffect(() => {
    let frame = 0;
    const loop = () => {
      setSource(sourceTime());
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);
  const duration = frames > 0 && sampleRate > 0 ? frames / sampleRate : 0;
  const progress = duration > 0 ? Math.min(1, source / duration) : 0;
  const heard = readRate > 0 ? source / readRate : source;
  const heardDuration = readRate > 0 ? duration / readRate : duration;
  return (
    <div>
      <div className="mb-2 flex flex-wrap justify-between gap-2 font-mono text-xs tabular-nums text-muted">
        <span>
          Groove {formatTime(source)} / {formatTime(duration)}
        </span>
        <span>
          Heard {formatTime(heard)} / {formatTime(heardDuration)}
        </span>
      </div>
      <Waveform peaks={peaks} progress={progress} onSeek={seekRatio} />
    </div>
  );
}

export function Bench() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [cut, setCut] = useState(RPM_33_50);
  const [play, setPlay] = useState(RPM_33_1_3);
  const [original, setOriginal] = useState(false);
  const [level, setLevel] = useState(0.8);
  const [wide, setWide] = useState(false);
  const [over, setOver] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);

  const programmed = describeSpeed(cut, play);
  const hearing = original ? describeSpeed(cut, cut) : programmed;
  const needsWide = cut < 32 || cut > 35 || play < 32 || play > 35;
  const rangeWide = wide || needsWide;
  const min = rangeWide ? RPM_MIN : 32;
  const max = rangeWide ? RPM_MAX : 35;

  useEffect(() => {
    if (!isReady()) void loadLacquer();
  }, []);

  useEffect(() => {
    setReadRate(hearing.readRate);
  }, [hearing.readRate]);

  useEffect(() => {
    setVolume(level);
  }, [level]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (tag === "BUTTON" || tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) return;
      }
      event.preventDefault();
      void togglePlay();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function onExport(bits: 16 | 24) {
    setExporting(true);
    setExportError(null);
    setExportProgress(0);
    try {
      const bytes = await bounce(programmed.readRate, bits, setExportProgress);
      const rateName = formatRate(programmed.readRate).replace("/", "-");
      downloadBytes(bytes, `${exportBase(snap.name)}.${rateName}.wav`);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        const file = event.dataTransfer.files[0];
        if (file) void loadFile(file);
      }}
    >
      <p className="font-mono text-xs tracking-wide text-subtle">VARISPEED</p>
      <h1 className="mt-2 font-display text-4xl leading-tight tracking-tight">Spindle</h1>
      <p className="mt-3 max-w-prose text-base leading-relaxed text-muted">
        Play a file the way a turntable would if the lacquer was cut at one speed and the platter in the room
        ran at another. The default treats your audio as a 33.50 cut and listens at 33⅓: rate {formatRate(200 / 201)},{" "}
        {formatSigned(describeSpeed(RPM_33_50, RPM_33_1_3).cents, 2, " cents")}, and the side grows by exactly half a
        percent.
      </p>

      <div className="mt-8 grid items-center gap-8 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div>
          <Platter rpm={original ? cut : play} label={formatRpm(original ? cut : play)} playing={snap.playing} />
          <p className="mt-3 text-center text-sm text-muted">
            {original ? "Hearing the file" : `Hearing ${formatRpm(play)}`}
          </p>
        </div>

        <div className="min-w-0">
          <div className="grid gap-2 sm:grid-cols-3">
            {PRESETS.map((preset) => {
              const active = near(cut, preset.cut) && near(play, preset.play);
              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setCut(preset.cut);
                    setPlay(preset.play);
                    setOriginal(false);
                  }}
                  className={
                    active
                      ? "min-h-11 rounded-lg bg-label px-3 py-2 text-left text-ink"
                      : "min-h-11 rounded-lg border border-border bg-bg-elevated px-3 py-2 text-left text-fg"
                  }
                >
                  <span className="block text-sm font-medium">{preset.label}</span>
                  <span className={active ? "mt-1 block text-xs text-ink/80" : "mt-1 block text-xs text-muted"}>
                    {preset.detail}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Read rate" value={formatRate(hearing.readRate)} />
            <Stat label="Pitch" value={formatSigned(hearing.cents, 2, " cents")} />
            <Stat label="A440 lands" value={`${hearing.a440Hz.toFixed(2)} Hz`} />
            <Stat label="Duration" value={hearing.durationScale === 1.005 ? "×1.005" : `×${hearing.durationScale.toFixed(4)}`} />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-label px-5 font-medium text-ink disabled:opacity-40"
              onClick={() => void togglePlay()}
              disabled={!snap.ready}
            >
              {snap.playing ? <Pause className="size-4" /> : <Play className="size-4" />}
              {snap.playing ? "Pause" : "Play"}
            </button>
            <button
              type="button"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-4 text-fg disabled:opacity-40"
              onClick={() => stopTransport()}
              disabled={!snap.ready}
            >
              <Square className="size-4" />
              Stop
            </button>
            <button
              type="button"
              aria-pressed={original}
              className={
                original
                  ? "inline-flex h-11 items-center rounded-full bg-fg px-4 font-medium text-ink"
                  : "inline-flex h-11 items-center rounded-full border border-border px-4 text-fg"
              }
              onClick={() => setOriginal((value) => !value)}
            >
              {original ? "Back to preset" : "Hear original"}
            </button>
          </div>
          <p className="mt-2 text-sm text-subtle">Space plays and pauses. Hear original is the bypass, for the A/B.</p>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-border bg-bg-elevated p-4">
        <Groove peaks={snap.peaks} sampleRate={snap.sampleRate} frames={snap.frames} readRate={hearing.readRate} />
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 text-sm">
          <p className="min-w-0 truncate text-fg" title={snap.name}>
            {snap.ready ? snap.name : "Loading the reference lacquer"}
            {snap.kind === "lacquer" ? " — 440 Hz, then a phrase" : ""}
          </p>
          {snap.ready ? (
            <p className="font-mono text-xs tabular-nums text-muted">
              {snap.channels} ch · {snap.sampleRate} Hz
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-fg">Trim</h2>
            <button
              type="button"
              aria-pressed={rangeWide}
              disabled={needsWide}
              className="h-11 rounded-full border border-border px-3 text-sm text-muted disabled:opacity-60"
              onClick={() => setWide((value) => !value)}
            >
              {needsWide ? "Full range" : rangeWide ? "Narrow to 32–35" : "Open 16–90"}
            </button>
          </div>
          <div className="space-y-4">
            <RpmControl label="Cut RPM" value={cut} min={min} max={max} onChange={setCut} />
            <RpmControl label="Play RPM" value={play} min={min} max={max} onChange={setPlay} />
          </div>
          <div className="mt-4">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-sm text-muted">Level</span>
              <span className="font-mono text-sm tabular-nums text-fg">{Math.round(level * 100)}</span>
            </div>
            <Slider.Root
              className="relative flex h-11 touch-none items-center"
              min={0}
              max={1}
              step={0.01}
              value={[level]}
              onValueChange={(next) => {
                const value = next[0];
                if (value !== undefined) setLevel(value);
              }}
              aria-label="Level"
            >
              <Slider.Track className="relative h-px grow bg-border">
                <Slider.Range className="absolute h-px bg-fg" />
              </Slider.Track>
              <Slider.Thumb className="block size-4 rounded-full border border-ink bg-label" />
            </Slider.Root>
          </div>
          <p className="mt-3 text-sm text-subtle">
            Presets use 100/3, not the truncation 33.33. Drag if you want the two-decimal number. 16⅔, 45, and 78 are in
            the wide range. Same kernel.
          </p>
        </div>

        <div
          className={
            over
              ? "rounded-xl border border-fg bg-bg-subtle p-4"
              : "rounded-xl border border-border p-4"
          }
        >
          <h2 className="text-sm font-medium text-fg">Source and bounce</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Drop a WAV, MP3, FLAC, M4A, or MP4. Video MP4s contribute their audio track when the browser can unpack
            it. Listening uses the browser resampler. The WAV bounce uses the cubic Hermite kernel the VST note
            transcribes. Speed only — no crackle, wow, or RIAA.
          </p>
          <label className="mt-4 flex h-11 cursor-pointer items-center justify-center rounded-full border border-border text-sm text-fg">
            <input
              type="file"
              accept=".wav,.mp4,.m4a,.mp3,.flac,.ogg,.aac,audio/*,video/mp4"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void loadFile(file);
                event.target.value = "";
              }}
            />
            Choose a file
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="h-11 rounded-full bg-label px-4 text-sm font-medium text-ink disabled:opacity-40"
              disabled={!snap.ready || exporting}
              onClick={() => void onExport(24)}
            >
              {exporting ? `Bouncing ${Math.round(exportProgress * 100)}%` : "Export 24-bit WAV"}
            </button>
            <button
              type="button"
              className="h-11 rounded-full border border-border px-4 text-sm text-fg disabled:opacity-40"
              disabled={!snap.ready || exporting}
              onClick={() => void onExport(16)}
            >
              16-bit
            </button>
            <button
              type="button"
              className="h-11 rounded-full border border-border px-4 text-sm text-fg"
              onClick={() => downloadText(kernelSource, "spindle-vinylSpeed.ts", "text/typescript")}
            >
              Download plugin
            </button>
            <button
              type="button"
              className="h-11 rounded-full border border-border px-4 text-sm text-muted"
              onClick={() => void loadLacquer()}
            >
              Reference lacquer
            </button>
          </div>
          {exportError ? <p className="mt-3 text-sm text-danger">{exportError}</p> : null}
          {snap.error ? <p className="mt-3 text-sm text-danger">{snap.error}</p> : null}
          <p className="mt-4 text-sm text-muted">
            Export follows the preset, even while Original is up.{" "}
            <Link to="/notes" className="text-fg underline decoration-border underline-offset-4">
              Why 33⅓ won, and how to port the kernel
            </Link>
            .
          </p>
        </div>
      </div>
      <p className="mt-6 font-mono text-xs text-subtle">
        Kernel parameters {PARAMETERS.map((item) => item.id).join(" · ")} · docs in the Notes
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-bg-elevated px-3 py-3">
      <p className="text-xs text-subtle">{label}</p>
      <p className="mt-1 font-mono text-sm tabular-nums text-fg sm:text-base">{value}</p>
    </div>
  );
}
