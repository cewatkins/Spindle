import { outputFrameCount, processBlock } from "@/dsp/vinylSpeed";
import { renderLacquer } from "@/dsp/lacquer";
import { encodeWavPcm } from "@/dsp/wav";

export interface SessionSnap {
  ready: boolean;
  name: string;
  kind: "empty" | "lacquer" | "file";
  sampleRate: number;
  frames: number;
  channels: number;
  playing: boolean;
  error: string | null;
  peaks: number[];
}

const EMPTY: SessionSnap = {
  ready: false,
  name: "",
  kind: "empty",
  sampleRate: 44100,
  frames: 0,
  channels: 0,
  playing: false,
  error: null,
  peaks: [],
};

type Engine = {
  ctx: AudioContext | null;
  gain: GainNode | null;
  source: AudioBufferSourceNode | null;
  buffer: AudioBuffer | null;
  pcm: Float32Array[] | null;
  sampleRate: number;
  readRate: number;
  playing: boolean;
  anchorSource: number;
  anchorCtx: number;
  volume: number;
};

const engine: Engine = {
  ctx: null,
  gain: null,
  source: null,
  buffer: null,
  pcm: null,
  sampleRate: 44100,
  readRate: 1,
  playing: false,
  anchorSource: 0,
  anchorCtx: 0,
  volume: 0.8,
};

let snap: SessionSnap = EMPTY;
let op = 0;
const listeners = new Set<() => void>();

function emit() {
  const pcm = engine.pcm;
  snap = {
    ready: pcm !== null,
    name: snap.name,
    kind: snap.kind,
    sampleRate: engine.sampleRate,
    frames: pcm?.[0]?.length ?? 0,
    channels: pcm?.length ?? 0,
    playing: engine.playing,
    error: snap.error,
    peaks: snap.peaks,
  };
  for (const listener of listeners) listener();
}

function fail(message: string) {
  snap = { ...snap, error: message };
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): SessionSnap {
  return snap;
}

export function getServerSnapshot(): SessionSnap {
  return EMPTY;
}

export function isReady() {
  return engine.pcm !== null;
}

export function sourceTime(): number {
  if (!engine.playing || !engine.ctx) return engine.anchorSource;
  const elapsed = engine.ctx.currentTime - engine.anchorCtx;
  const t = engine.anchorSource + elapsed * engine.readRate;
  const dur = engine.buffer?.duration ?? 0;
  if (dur <= 0) return t;
  return Math.min(t, dur);
}

function getCtx(): AudioContext {
  if (engine.ctx && engine.gain) return engine.ctx;
  const ctx = new AudioContext();
  const gain = ctx.createGain();
  gain.gain.value = engine.volume;
  gain.connect(ctx.destination);
  engine.ctx = ctx;
  engine.gain = gain;
  return ctx;
}

function stopSource() {
  const node = engine.source;
  engine.source = null;
  if (!node) return;
  node.onended = null;
  try {
    node.stop();
  } catch {
    /* already stopped */
  }
  node.disconnect();
}

function startAt(seconds: number) {
  const ctx = getCtx();
  const buffer = engine.buffer;
  const gain = engine.gain;
  if (!buffer || !gain) return;
  stopSource();
  const dur = buffer.duration;
  const offset = Math.min(Math.max(0, seconds), Math.max(0, dur - 0.001));
  const node = ctx.createBufferSource();
  node.buffer = buffer;
  node.playbackRate.value = engine.readRate;
  node.connect(gain);
  node.onended = () => {
    if (engine.source !== node) return;
    engine.source = null;
    engine.playing = false;
    engine.anchorSource = buffer.duration;
    emit();
  };
  node.start(0, offset);
  engine.source = node;
  engine.anchorSource = offset;
  engine.anchorCtx = ctx.currentTime;
  engine.playing = true;
  emit();
}

function makePeaks(channel: Float32Array, columns: number): number[] {
  const peaks = new Array<number>(columns).fill(0);
  const n = channel.length;
  if (n === 0) return peaks;
  const bucket = n / columns;
  for (let i = 0; i < columns; i++) {
    const start = Math.floor(i * bucket);
    const end = Math.min(n, Math.floor((i + 1) * bucket));
    let peak = 0;
    const stride = Math.max(1, Math.floor((end - start) / 48));
    for (let j = start; j < end; j += stride) {
      const value = channel[j] ?? 0;
      const mag = value < 0 ? -value : value;
      if (mag > peak) peak = mag;
    }
    peaks[i] = peak;
  }
  return peaks;
}

function install(name: string, kind: "lacquer" | "file", channels: Float32Array[], sampleRate: number) {
  const ctx = getCtx();
  stopSource();
  engine.playing = false;
  engine.anchorSource = 0;
  const buffer = ctx.createBuffer(channels.length, channels[0]?.length ?? 0, sampleRate);
  channels.forEach((channel, index) => {
    buffer.getChannelData(index).set(channel);
  });
  engine.buffer = buffer;
  engine.pcm = channels;
  engine.sampleRate = sampleRate;
  const first = channels[0];
  snap = {
    ready: true,
    name,
    kind,
    sampleRate,
    frames: first?.length ?? 0,
    channels: channels.length,
    playing: false,
    error: null,
    peaks: first ? makePeaks(first, 720) : [],
  };
  for (const listener of listeners) listener();
}

export async function loadLacquer() {
  const id = ++op;
  const channels = renderLacquer(44100);
  if (id !== op) return;
  install("Reference lacquer", "lacquer", channels, 44100);
}

const DECODE_HELP =
  "Couldn't decode that file. WAV, MP3, FLAC, M4A, and most MP4 audio tracks work in this browser. If this MP4 keeps its audio in a codec the browser won't unpack, bounce it to WAV first.";

export async function loadFile(file: File) {
  if (file.size > 100 * 1024 * 1024) {
    fail("That file is over 100 MB. Bounce a shorter WAV and drop that.");
    return;
  }
  const id = ++op;
  try {
    const ctx = getCtx();
    await ctx.resume();
    const raw = await file.arrayBuffer();
    if (id !== op) return;
    const audio = await ctx.decodeAudioData(raw.slice(0));
    if (id !== op) return;
    const channels: Float32Array[] = [];
    for (let c = 0; c < audio.numberOfChannels; c++) {
      channels.push(new Float32Array(audio.getChannelData(c)));
    }
    const first = channels[0];
    if (!first || first.length < 2) {
      fail("That file didn't contain playable audio.");
      return;
    }
    install(file.name, "file", channels, audio.sampleRate);
  } catch {
    if (id !== op) return;
    fail(DECODE_HELP);
  }
}

export async function togglePlay() {
  const ctx = getCtx();
  await ctx.resume();
  if (!engine.buffer) return;
  if (engine.playing) {
    engine.anchorSource = sourceTime();
    engine.playing = false;
    stopSource();
    emit();
    return;
  }
  const dur = engine.buffer.duration;
  const start = engine.anchorSource >= dur - 0.05 ? 0 : engine.anchorSource;
  startAt(start);
}

export function stopTransport() {
  engine.anchorSource = 0;
  engine.playing = false;
  stopSource();
  emit();
}

export function seekRatio(ratio: number) {
  if (!engine.buffer) return;
  const clamped = Math.min(1, Math.max(0, ratio));
  const t = clamped * engine.buffer.duration;
  if (engine.playing) startAt(t);
  else {
    engine.anchorSource = t;
    emit();
  }
}

export function setReadRate(rate: number) {
  if (!(rate > 0) || !Number.isFinite(rate)) return;
  if (engine.readRate === rate) return;
  const position = sourceTime();
  engine.readRate = rate;
  engine.anchorSource = position;
  engine.anchorCtx = engine.ctx?.currentTime ?? 0;
  if (engine.source) {
    engine.source.playbackRate.setValueAtTime(rate, engine.anchorCtx);
  }
}

export function setVolume(volume: number) {
  const next = Math.min(1, Math.max(0, volume));
  engine.volume = next;
  if (engine.gain && engine.ctx) {
    engine.gain.gain.setValueAtTime(next, engine.ctx.currentTime);
  } else if (engine.gain) {
    engine.gain.gain.value = next;
  }
}

export async function bounce(
  rate: number,
  bits: 16 | 24,
  onProgress: (fraction: number) => void,
): Promise<Uint8Array> {
  const pcm = engine.pcm;
  if (!pcm || !pcm[0]) throw new Error("Nothing is loaded.");
  const frames = outputFrameCount(pcm[0].length, rate);
  if (frames * pcm.length > 32_000_000) {
    throw new Error("That ratio makes a file this page can't hold. Move the speeds closer, or use a shorter source.");
  }
  const outputs = pcm.map(() => new Float32Array(frames));
  const chunk = 65536;
  for (let start = 0; start < frames; start += chunk) {
    const end = Math.min(frames, start + chunk);
    const origin = start * rate;
    for (let c = 0; c < pcm.length; c++) {
      const source = pcm[c];
      const target = outputs[c];
      if (!source || !target) continue;
      processBlock(source, target.subarray(start, end), origin, rate);
    }
    onProgress(frames === 0 ? 1 : end / frames);
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  onProgress(1);
  return encodeWavPcm(outputs, engine.sampleRate, bits, true);
}
