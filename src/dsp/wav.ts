/**
 * PCM WAV writer for the bounce. Not part of the plugin kernel.
 * Dither lives here, at the moment floats become integers — never inside
 * processBlock. The VST host dithers on its own export.
 */

function writeStr(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
}

export function encodeWavPcm(
  channels: Float32Array[],
  sampleRate: number,
  bits: 16 | 24,
  dither = true,
): Uint8Array {
  if (bits !== 16 && bits !== 24) throw new Error("WAV bits must be 16 or 24");
  if (channels.length < 1 || channels.length > 8) throw new Error("Channel count must be 1–8");
  const frames = channels[0].length;
  for (const channel of channels) {
    if (channel.length !== frames) throw new Error("Channel length mismatch");
  }
  const bytesPerSample = bits >> 3;
  const blockAlign = channels.length * bytesPerSample;
  const dataSize = frames * blockAlign;
  const pad = dataSize & 1;
  const buffer = new ArrayBuffer(44 + dataSize + pad);
  const view = new DataView(buffer);

  writeStr(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize + pad, true);
  writeStr(view, 8, "WAVE");
  writeStr(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels.length, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bits, true);
  writeStr(view, 36, "data");
  view.setUint32(40, dataSize, true);

  const scale = bits === 16 ? 32768 : 8388608;
  const max = scale - 1;
  let offset = 44;
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < channels.length; c++) {
      let x = channels[c][i] ?? 0;
      if (dither) x += (Math.random() + Math.random() - 1) / scale;
      if (x > 1) x = 1;
      else if (x < -1) x = -1;
      let n = Math.round(x * max);
      if (n > max) n = max;
      if (n < -scale) n = -scale;
      if (bits === 16) {
        view.setInt16(offset, n, true);
        offset += 2;
      } else {
        view.setUint8(offset, n & 0xff);
        view.setUint8(offset + 1, (n >> 8) & 0xff);
        view.setUint8(offset + 2, (n >> 16) & 0xff);
        offset += 3;
      }
    }
  }
  return new Uint8Array(buffer);
}
