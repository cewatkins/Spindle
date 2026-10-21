import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderLacquer } from "./lacquer.ts";
import {
  READ_RATE_33_50_ON_33_1_3,
  READ_RATE_RESTORE,
  RPM_33_1_3,
  RPM_33_50,
  describeSpeed,
  outputFrameCount,
  processBlock,
  readRate,
} from "./vinylSpeed.ts";
import { encodeWavPcm } from "./wav.ts";

function goertzel(samples: Float32Array, sampleRate: number, freq: number): number {
  const n = samples.length;
  const k = Math.round((freq * n) / sampleRate);
  const w = (2 * Math.PI * k) / n;
  const coeff = 2 * Math.cos(w);
  let s1 = 0;
  let s2 = 0;
  for (let i = 0; i < n; i++) {
    const s0 = (samples[i] ?? 0) + coeff * s1 - s2;
    s2 = s1;
    s1 = s0;
  }
  return s1 * s1 + s2 * s2 - coeff * s1 * s2;
}

describe("33.50 against 33⅓", () => {
  it("locks the ratio at exactly 200/201", () => {
    const rate = readRate(RPM_33_50, RPM_33_1_3);
    assert.equal(rate, READ_RATE_33_50_ON_33_1_3);
    assert.equal(rate, 200 / 201);
    assert.equal(readRate(RPM_33_1_3, RPM_33_50), READ_RATE_RESTORE);
    assert.equal(READ_RATE_RESTORE, 1.005);
  });

  it("reports −8.6346 cents and A440 at 437.81 Hz", () => {
    const report = describeSpeed(RPM_33_50, RPM_33_1_3);
    const cents = 1200 * Math.log2(200 / 201);
    assert.ok(Math.abs(report.cents - cents) < 1e-9);
    assert.ok(Math.abs(report.cents - -8.634601685044663) < 1e-9);
    assert.ok(Math.abs(report.a440Hz - 437.81094527363183) < 1e-9);
    assert.equal(report.durationScale, 1.005);
    assert.ok(Math.abs(report.percent - -0.497512437810943) < 1e-12);
  });
});

describe("processBlock", () => {
  it("is sample-identical at rate 1, including the ends", () => {
    const input = new Float32Array([0.2, -0.4, 0.6, -0.8, 0.1, 0.9, -0.3]);
    const output = new Float32Array(input.length);
    const next = processBlock(input, output, 0, 1);
    assert.equal(next, input.length);
    assert.deepEqual(Array.from(output), Array.from(input));
  });

  it("matches a split render to a single render", () => {
    const input = new Float32Array(1000);
    for (let i = 0; i < input.length; i++) input[i] = Math.sin(i * 0.07);
    const rate = 200 / 201;
    const full = new Float32Array(outputFrameCount(input.length, rate));
    processBlock(input, full, 0, rate);
    const mid = 400;
    const a = new Float32Array(mid);
    const b = new Float32Array(full.length - mid);
    const originB = processBlock(input, a, 0, rate);
    processBlock(input, b, originB, rate);
    const joined = new Float32Array(full.length);
    joined.set(a, 0);
    joined.set(b, mid);
    assert.deepEqual(Array.from(joined), Array.from(full));
  });

  it("moves a 440 Hz tone to 437.81 Hz at 200/201", () => {
    const sampleRate = 48000;
    const input = new Float32Array(sampleRate);
    for (let i = 0; i < input.length; i++) {
      input[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate);
    }
    const rate = 200 / 201;
    const output = new Float32Array(outputFrameCount(input.length, rate));
    processBlock(input, output, 0, rate);
    const target = 440 * rate;
    const atTarget = goertzel(output, sampleRate, target);
    const at440 = goertzel(output, sampleRate, 440);
    assert.ok(atTarget > at440 * 20);
  });
});

describe("wav", () => {
  it("writes a 16-bit stereo header and a full-scale sample", () => {
    const bytes = encodeWavPcm([new Float32Array([1, 0]), new Float32Array([-1, 0.5])], 44100, 16, false);
    assert.equal(String.fromCharCode(...bytes.subarray(0, 4)), "RIFF");
    assert.equal(String.fromCharCode(...bytes.subarray(8, 12)), "WAVE");
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    assert.equal(view.getUint16(22, true), 2);
    assert.equal(view.getUint32(24, true), 44100);
    assert.equal(view.getUint16(34, true), 16);
    assert.equal(view.getInt16(44, true), 32767);
    assert.equal(view.getInt16(46, true), -32767);
  });
});

describe("lacquer", () => {
  it("stays inside unity and starts as a 440 Hz tone", () => {
    const [left, right] = renderLacquer(48000);
    assert.ok(left);
    assert.ok(right);
    assert.equal(left.length, right.length);
    assert.equal(left.length, 48000 * 16);
    let peak = 0;
    for (let i = 0; i < left.length; i++) {
      peak = Math.max(peak, Math.abs(left[i] ?? 0), Math.abs(right[i] ?? 0));
    }
    assert.ok(peak <= 1);
    assert.ok(peak > 0.05);
    const head = left.subarray(2400, 48000);
    const at440 = goertzel(head, 48000, 440);
    const at437 = goertzel(head, 48000, 437.81);
    assert.ok(at440 > at437);
  });
});
