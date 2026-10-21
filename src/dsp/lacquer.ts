/** Deterministic reference program: 2s of A440, then a short mallet phrase. */

function edgeFade(index: number, length: number, fade: number): number {
  if (index < fade) return index / fade;
  if (index > length - fade) return Math.max(0, (length - index) / fade);
  return 1;
}

export function renderLacquer(sampleRate: number): Float32Array[] {
  const seconds = 16;
  const n = Math.floor(sampleRate * seconds);
  const left = new Float32Array(n);
  const right = new Float32Array(n);
  const toneEnd = Math.floor(sampleRate * 2);
  const fade = Math.floor(sampleRate * 0.012);
  for (let i = 0; i < toneEnd; i++) {
    const s = Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.22 * edgeFade(i, toneEnd, fade);
    left[i] = s;
    right[i] = s;
  }

  const notes = [440, 554.3653, 659.2551, 880, 659.2551, 554.3653];
  const step = Math.floor(sampleRate * 0.5);
  const attackSamples = Math.max(1, Math.floor(sampleRate * 0.006));
  for (let i = toneEnd; i < n; i++) {
    const local = i - toneEnd;
    const idx = Math.floor(local / step) % notes.length;
    const within = local % step;
    const env = Math.exp(-3.4 * (within / step));
    const attack = Math.min(1, within / attackSamples);
    const f = notes[idx] ?? 440;
    const t = i / sampleRate;
    const mallet =
      Math.sin(2 * Math.PI * f * t) * 0.72 +
      Math.sin(2 * Math.PI * f * 2 * t) * 0.2 +
      Math.sin(2 * Math.PI * f * 3 * t) * 0.08;
    const s = mallet * env * attack * 0.3;
    const fifth = Math.sin(2 * Math.PI * f * 1.5 * t) * env * attack * 0.1;
    left[i] = s;
    right[i] = s * 0.82 + fifth;
  }
  return [left, right];
}
