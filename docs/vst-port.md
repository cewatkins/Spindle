# Porting Spindle to a VST

The plugin is one file: `src/dsp/vinylSpeed.ts`. It does not import React, the DOM, or Web Audio. A JUCE port is a transcription of that file, not a rewrite of the bench. The golden tests live in `src/dsp/vinylSpeed.test.ts`. If those still pass after the port, the plugin is Spindle.

## What the DSP is

A constant-ratio resampler. Output sample i reads the source at position `origin + i * readRate`, through cubic Hermite interpolation.

readRate = playRpm / cutRpm

When readRate is 200/201, the output is longer than the input by exactly 0.5% and every partial sits 8.63 cents flat. That is the whole product. The web bench's Export button calls this same function.

## What it is not

A realtime insert cannot change duration. The host asks for N samples and wants N samples back, on a timeline that is not yours. Varispeed changes how many samples the program occupies.

Build one of these, in this order:

1. A clip processor. The plugin holds the source buffer, the way the bench does, and the host plays it as an instrument — or you bounce offline from a button.
2. An offline bounce. Same function, writing a new clip. This is Export WAV.
3. Not a delay used as an insert. A fractional delay can wobble pitch, which is wow. It cannot run half a percent slow for a whole side without the buffer emptying or the host time moving.

If a DAW already plays clips with a raw resample rate and time-stretch off, setting that rate to 200/201 is this plugin. The point of the port is to make the ratio a labeled pair of controls — Cut RPM, Play RPM — instead of a mystery percent.

## Parameters

- `cutRpm`, "Cut RPM", default 33.5, range 16 to 90
- `playRpm`, "Play RPM", default 100/3, range 16 to 90
- `bypass`, default off. Bypass forces readRate to 1

Do not reset the read position when the ratio changes. A jump in position is a click. Changing the step size is not, as long as the phase stays continuous: the next block starts where this one ended, and only the increment uses the new rate.

Save cutRpm, playRpm, and bypass. Do not save the audio in the preset.

## The kernel

Copy these coefficients. Leave JUCE's Lagrange interpolator alone if the golden tests are supposed to match. Hermite is transparent at half a percent. If you later care about 33 against 45 or 78, replace the interpolator with a windowed sinc and keep the ratio math. The 200/201 tests stay either way.

```
c0 = y1
c1 = 0.5 * (y2 - y0)
c2 = y0 - 2.5 * y1 + 2.0 * y2 - 0.5 * y3
c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2)
y  = ((c3 * t + c2) * t + c1) * t + c0
```

y0 through y3 are the source samples at floor(pos)−1, floor(pos), floor(pos)+1, and floor(pos)+2. t is the fractional part. Clamp the indices to the ends of the buffer. Do not wrap. If pos is outside the buffer, write silence.

No allocation inside the block. The caller owns the output. No hidden gain, filter, or dither in this file. Dither belongs at the integer export. In the web app that is `src/dsp/wav.ts`. In a plugin it is the host.

## The block call

```
double rate = playRpm / cutRpm;
double next = processBlock(source, output, origin, rate);
origin = next;
```

`processBlock` writes one block and returns `origin + frames * rate`.

Stereo is two calls, one per channel, with the same origin and the same rate. Do not let the channels keep separate phases.

`outputFrameCount(n, rate)` is `floor((n - 1) / rate) + 1`. That is how long the bounce is. The last output sample still lands on the last input sample.

## A JUCE shape that stays boring

- `VinylSpeed.h` and `VinylSpeed.cpp` — the transcription. Functions keep the names `readRate`, `describeSpeed`, `hermite`, `processBlock`, `outputFrameCount`.
- The processor holds an `AudioProcessorValueTreeState` with the three parameters, plus an `AudioBuffer<float>` loaded from the editor.
- `processBlock` either reads that buffer as a clip and fills the host buffer, or it stays empty and a bounce button runs the kernel offline. Prefer the offline bounce if you do not want to pretend an insert can change duration.
- The editor is two sliders, three presets (Hear 33⅓, Restore, Locked), and the readouts the bench already shows: cents, where A440 lands, duration scale. The platter does not need to survive the port.

Report latency as 0 when the source is a loaded clip. The interpolator looks one sample behind and two ahead, but it is not a delay line on the live input, because the live input is not the source.

## Tests that must still pass

- `(100/3) / 33.5` equals `200/201`, with zero double error
- Cents equal `1200 * log2(200/201)`, which is −8.634601685044663
- A440 lands at 437.81094527363183 Hz
- Duration scale of that preset is exactly 1.005
- Rate 1 reproduces the source sample for sample, including both ends
- A 440 Hz sine resampled at 200/201 has its energy at 437.81 Hz, not at 440
- Two half-length blocks concatenated equal one full call

Run them here with the DSP tests in `src/dsp/vinylSpeed.test.ts` before you change a coefficient.

## Listener versus bounce

The bench plays through the browser resampler, by setting `AudioBufferSourceNode.playbackRate`, so a knob move is instant and does not click. Export WAV, and the tests, call `processBlock`. At 200/201 they are the same musical object. They are not bitwise identical. Trust the test file for the port. Trust the bench for the ratio.
