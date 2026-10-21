import{n as e,r as t}from"./index-_caZWVkp.js";var n=`/**
 * Spindle varispeed kernel.
 *
 * This file is the plugin. It imports nothing. A VST port is a transcription
 * of the functions below — see docs/vst-port.md and src/dsp/vinylSpeed.test.ts.
 *
 * Model: a groove cut at \`cutRpm\` and heard at \`playRpm\` is a constant-ratio
 * resample. Output sample i reads the source at \`origin + i * (playRpm / cutRpm)\`.
 * Pitch and duration move together. No time-stretch, EQ, wow, or noise.
 *
 * Realtime inserts cannot change duration. Call this as a clip reader or an
 * offline bounce. Do not reset the read position when the ratio changes.
 */

/** The locked standard: exactly 100/3, not the truncation 33.33. */
export const RPM_33_1_3 = 100 / 3;

/** The decimal people say: thirty-three and a half. */
export const RPM_33_50 = 33.5;

/**
 * (100/3) / 33.5 = 200/201.
 * Source samples advanced per output sample when a 33.50 cut is heard at 33⅓.
 * In IEEE-754 double this division is exact.
 */
export const READ_RATE_33_50_ON_33_1_3 = 200 / 201;

/** Inverse restore: a 33.50 capture returned to 33⅓ pitch. Exactly +0.5%. */
export const READ_RATE_RESTORE = 201 / 200;

export const RPM_MIN = 16;
export const RPM_MAX = 90;

export const PARAMETERS = [
  { id: "cutRpm", name: "Cut RPM", defaultValue: RPM_33_50, min: RPM_MIN, max: RPM_MAX },
  { id: "playRpm", name: "Play RPM", defaultValue: RPM_33_1_3, min: RPM_MIN, max: RPM_MAX },
] as const;

export interface SpeedReport {
  /** Source samples consumed per output sample. Below 1 slows and flattens. */
  readRate: number;
  /** outputDuration / inputDuration = cutRpm / playRpm. */
  durationScale: number;
  /** (readRate - 1) * 100. */
  percent: number;
  /** 1200 * log2(readRate). */
  cents: number;
  /** Where a 440 Hz tone lands. */
  a440Hz: number;
}

export function readRate(cutRpm: number, playRpm: number): number {
  if (!(cutRpm > 0) || !(playRpm > 0) || !Number.isFinite(cutRpm) || !Number.isFinite(playRpm)) {
    throw new Error("RPM must be a positive finite number");
  }
  return playRpm / cutRpm;
}

export function describeSpeed(cutRpm: number, playRpm: number): SpeedReport {
  const rate = readRate(cutRpm, playRpm);
  return {
    readRate: rate,
    durationScale: cutRpm / playRpm,
    percent: (rate - 1) * 100,
    cents: 1200 * Math.log2(rate),
    a440Hz: 440 * rate,
  };
}

/**
 * Cubic Hermite. Copy these coefficients into the C++ port:
 *   c0 = y1
 *   c1 = 0.5 * (y2 - y0)
 *   c2 = y0 - 2.5 * y1 + 2 * y2 - 0.5 * y3
 *   c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2)
 *   y  = ((c3 * t + c2) * t + c1) * t + c0
 */
export function hermite(y0: number, y1: number, y2: number, y3: number, t: number): number {
  const c0 = y1;
  const c1 = 0.5 * (y2 - y0);
  const c2 = y0 - 2.5 * y1 + 2 * y2 - 0.5 * y3;
  const c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2);
  return ((c3 * t + c2) * t + c1) * t + c0;
}

/** Frames required so the last output sample still lands inside the source. */
export function outputFrameCount(inputLength: number, rate: number): number {
  if (!(rate > 0) || !Number.isFinite(rate)) throw new Error("readRate must be positive");
  if (inputLength <= 0) return 0;
  return Math.floor((inputLength - 1) / rate) + 1;
}

/**
 * Write \`output.length\` samples.
 * Sample i reads \`origin + i * readRate\`.
 * Returns the origin for the next block: \`origin + output.length * readRate\`.
 * Indices clamp. Past either end, write silence. No wrap, no allocation.
 */
export function processBlock(
  input: Float32Array,
  output: Float32Array,
  origin: number,
  rate: number,
): number {
  const n = input.length;
  const m = output.length;
  if (!(rate > 0) || !Number.isFinite(rate)) throw new Error("readRate must be positive");
  if (n === 0) {
    output.fill(0);
    return origin + m * rate;
  }
  const last = n - 1;
  for (let i = 0; i < m; i++) {
    const pos = origin + i * rate;
    if (!(pos >= 0) || pos > last) {
      output[i] = 0;
      continue;
    }
    const i1 = Math.floor(pos);
    const t = pos - i1;
    const i0 = i1 > 0 ? i1 - 1 : 0;
    const base = i1 < n ? i1 : last;
    const i2 = base < last ? base + 1 : last;
    const i3 = base + 1 < last ? base + 2 : last;
    output[i] = hermite(input[i0], input[base], input[i2], input[i3], t);
  }
  return origin + m * rate;
}
`,r=t();function i({children:t}){return(0,r.jsxs)(`div`,{className:`min-h-screen bg-bg text-fg`,children:[(0,r.jsx)(`header`,{className:`border-b border-border`,children:(0,r.jsxs)(`div`,{className:`mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4`,children:[(0,r.jsx)(e,{to:`/`,className:`font-display text-xl tracking-tight text-fg`,children:`Spindle`}),(0,r.jsxs)(`nav`,{className:`flex items-center gap-1 text-sm`,children:[(0,r.jsx)(e,{to:`/`,activeOptions:{exact:!0},className:`rounded-full px-3 py-2 text-muted`,activeProps:{className:`rounded-full bg-bg-subtle px-3 py-2 text-fg`},children:`Bench`}),(0,r.jsx)(e,{to:`/notes`,className:`rounded-full px-3 py-2 text-muted`,activeProps:{className:`rounded-full bg-bg-subtle px-3 py-2 text-fg`},children:`Notes`})]})]})}),(0,r.jsx)(`main`,{className:`mx-auto max-w-5xl px-4 py-6 sm:py-8`,children:t})]})}export{n,i as t};