import { i as __toESM } from "../_runtime.mjs";
import { a as require_jsx_runtime, o as require_react } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as vinylSpeed_default, t as Shell } from "./shell-YrhLhiay.mjs";
import { i as Pause, n as Square, r as Play } from "../_libs/lucide-react.mjs";
import { i as SliderTrack, n as SliderRange, r as SliderThumb, t as Slider } from "../_libs/@radix-ui/react-slider+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DK5Lz-x0.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Platter({ rpm, label, playing }) {
	const disc = (0, import_react.useRef)(null);
	const angle = (0, import_react.useRef)(0);
	const last = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const node = disc.current;
		if (!node) return;
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		let frame = 0;
		const loop = (now) => {
			if (last.current == null) last.current = now;
			const dt = (now - last.current) / 1e3;
			last.current = now;
			if (playing) {
				angle.current = (angle.current + rpm / 60 * 360 * dt) % 360;
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative mx-auto aspect-square w-full max-w-72",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			ref: disc,
			className: "platter-face absolute inset-0 rounded-full border border-border"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "pointer-events-none absolute top-1/2 left-1/2 z-10 flex size-1/2 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-label text-ink",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-display text-2xl leading-none tracking-tight",
					children: label
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mt-1 font-mono text-xs tracking-wide",
					children: "RPM"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mt-2 size-2 rounded-full bg-ink" })
			]
		})]
	});
}
function barsOf(peaks, count) {
	if (peaks.length === 0) return [];
	if (peaks.length <= count) return peaks;
	const out = [];
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
function Waveform({ peaks, progress, onSeek }) {
	const bars = barsOf(peaks, 140);
	const seek = (clientX, width, left) => {
		if (width <= 0) return;
		onSeek(Math.min(1, Math.max(0, (clientX - left) / width)));
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative h-24 w-full cursor-pointer touch-none",
		onPointerDown: (event) => {
			const rect = event.currentTarget.getBoundingClientRect();
			seek(event.clientX, rect.width, rect.left);
		},
		role: "slider",
		"aria-label": "Groove position",
		"aria-valuemin": 0,
		"aria-valuemax": 100,
		"aria-valuenow": Math.round(progress * 100),
		tabIndex: 0,
		onKeyDown: (event) => {
			if (event.key === "ArrowRight") onSeek(Math.min(1, progress + .02));
			if (event.key === "ArrowLeft") onSeek(Math.max(0, progress - .02));
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex h-full items-center gap-px",
			"aria-hidden": "true",
			children: bars.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-px w-full bg-border" }) : bars.map((peak, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block min-w-0 flex-1 rounded-sm bg-label",
				style: { height: `${Math.max(6, Math.min(100, peak * 100))}%` }
			}, index))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "pointer-events-none absolute top-0 bottom-0 w-px bg-fg",
			style: { left: `${Math.min(100, Math.max(0, progress * 100))}%` }
		})]
	});
}
/**
* Spindle varispeed kernel.
*
* This file is the plugin. It imports nothing. A VST port is a transcription
* of the functions below — see docs/vst-port.md and src/dsp/vinylSpeed.test.ts.
*
* Model: a groove cut at `cutRpm` and heard at `playRpm` is a constant-ratio
* resample. Output sample i reads the source at `origin + i * (playRpm / cutRpm)`.
* Pitch and duration move together. No time-stretch, EQ, wow, or noise.
*
* Realtime inserts cannot change duration. Call this as a clip reader or an
* offline bounce. Do not reset the read position when the ratio changes.
*/
/** The locked standard: exactly 100/3, not the truncation 33.33. */
var RPM_33_1_3 = 100 / 3;
/** The decimal people say: thirty-three and a half. */
var RPM_33_50 = 33.5;
var PARAMETERS = [{
	id: "cutRpm",
	name: "Cut RPM",
	defaultValue: RPM_33_50,
	min: 16,
	max: 90
}, {
	id: "playRpm",
	name: "Play RPM",
	defaultValue: RPM_33_1_3,
	min: 16,
	max: 90
}];
function readRate(cutRpm, playRpm) {
	if (!(cutRpm > 0) || !(playRpm > 0) || !Number.isFinite(cutRpm) || !Number.isFinite(playRpm)) throw new Error("RPM must be a positive finite number");
	return playRpm / cutRpm;
}
function describeSpeed(cutRpm, playRpm) {
	const rate = readRate(cutRpm, playRpm);
	return {
		readRate: rate,
		durationScale: cutRpm / playRpm,
		percent: (rate - 1) * 100,
		cents: 1200 * Math.log2(rate),
		a440Hz: 440 * rate
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
function hermite(y0, y1, y2, y3, t) {
	const c0 = y1;
	const c1 = .5 * (y2 - y0);
	const c2 = y0 - 2.5 * y1 + 2 * y2 - .5 * y3;
	return (((.5 * (y3 - y0) + 1.5 * (y1 - y2)) * t + c2) * t + c1) * t + c0;
}
/** Frames required so the last output sample still lands inside the source. */
function outputFrameCount(inputLength, rate) {
	if (!(rate > 0) || !Number.isFinite(rate)) throw new Error("readRate must be positive");
	if (inputLength <= 0) return 0;
	return Math.floor((inputLength - 1) / rate) + 1;
}
/**
* Write `output.length` samples.
* Sample i reads `origin + i * readRate`.
* Returns the origin for the next block: `origin + output.length * readRate`.
* Indices clamp. Past either end, write silence. No wrap, no allocation.
*/
function processBlock(input, output, origin, rate) {
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
/** Deterministic reference program: 2s of A440, then a short mallet phrase. */
function edgeFade(index, length, fade) {
	if (index < fade) return index / fade;
	if (index > length - fade) return Math.max(0, (length - index) / fade);
	return 1;
}
function renderLacquer(sampleRate) {
	const n = Math.floor(sampleRate * 16);
	const left = new Float32Array(n);
	const right = new Float32Array(n);
	const toneEnd = Math.floor(sampleRate * 2);
	const fade = Math.floor(sampleRate * .012);
	for (let i = 0; i < toneEnd; i++) {
		const s = Math.sin(2 * Math.PI * 440 * i / sampleRate) * .22 * edgeFade(i, toneEnd, fade);
		left[i] = s;
		right[i] = s;
	}
	const notes = [
		440,
		554.3653,
		659.2551,
		880,
		659.2551,
		554.3653
	];
	const step = Math.floor(sampleRate * .5);
	const attackSamples = Math.max(1, Math.floor(sampleRate * .006));
	for (let i = toneEnd; i < n; i++) {
		const local = i - toneEnd;
		const idx = Math.floor(local / step) % notes.length;
		const within = local % step;
		const env = Math.exp(-3.4 * (within / step));
		const attack = Math.min(1, within / attackSamples);
		const f = notes[idx] ?? 440;
		const t = i / sampleRate;
		const s = (Math.sin(2 * Math.PI * f * t) * .72 + Math.sin(2 * Math.PI * f * 2 * t) * .2 + Math.sin(2 * Math.PI * f * 3 * t) * .08) * env * attack * .3;
		const fifth = Math.sin(2 * Math.PI * f * 1.5 * t) * env * attack * .1;
		left[i] = s;
		right[i] = s * .82 + fifth;
	}
	return [left, right];
}
/**
* PCM WAV writer for the bounce. Not part of the plugin kernel.
* Dither lives here, at the moment floats become integers — never inside
* processBlock. The VST host dithers on its own export.
*/
function writeStr(view, offset, value) {
	for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
}
function encodeWavPcm(channels, sampleRate, bits, dither = true) {
	if (bits !== 16 && bits !== 24) throw new Error("WAV bits must be 16 or 24");
	if (channels.length < 1 || channels.length > 8) throw new Error("Channel count must be 1–8");
	const frames = channels[0].length;
	for (const channel of channels) if (channel.length !== frames) throw new Error("Channel length mismatch");
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
	for (let i = 0; i < frames; i++) for (let c = 0; c < channels.length; c++) {
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
			view.setUint8(offset, n & 255);
			view.setUint8(offset + 1, n >> 8 & 255);
			view.setUint8(offset + 2, n >> 16 & 255);
			offset += 3;
		}
	}
	return new Uint8Array(buffer);
}
var EMPTY = {
	ready: false,
	name: "",
	kind: "empty",
	sampleRate: 44100,
	frames: 0,
	channels: 0,
	playing: false,
	error: null,
	peaks: []
};
var engine = {
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
	volume: .8
};
var snap = EMPTY;
var op = 0;
var listeners = /* @__PURE__ */ new Set();
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
		peaks: snap.peaks
	};
	for (const listener of listeners) listener();
}
function fail(message) {
	snap = {
		...snap,
		error: message
	};
	for (const listener of listeners) listener();
}
function subscribe(listener) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}
function getSnapshot() {
	return snap;
}
function getServerSnapshot() {
	return EMPTY;
}
function isReady() {
	return engine.pcm !== null;
}
function sourceTime() {
	if (!engine.playing || !engine.ctx) return engine.anchorSource;
	const elapsed = engine.ctx.currentTime - engine.anchorCtx;
	const t = engine.anchorSource + elapsed * engine.readRate;
	const dur = engine.buffer?.duration ?? 0;
	if (dur <= 0) return t;
	return Math.min(t, dur);
}
function getCtx() {
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
	} catch {}
	node.disconnect();
}
function startAt(seconds) {
	const ctx = getCtx();
	const buffer = engine.buffer;
	const gain = engine.gain;
	if (!buffer || !gain) return;
	stopSource();
	const dur = buffer.duration;
	const offset = Math.min(Math.max(0, seconds), Math.max(0, dur - .001));
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
function makePeaks(channel, columns) {
	const peaks = new Array(columns).fill(0);
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
function install(name, kind, channels, sampleRate) {
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
		peaks: first ? makePeaks(first, 720) : []
	};
	for (const listener of listeners) listener();
}
async function loadLacquer() {
	const id = ++op;
	const channels = renderLacquer(44100);
	if (id !== op) return;
	install("Reference lacquer", "lacquer", channels, 44100);
}
var DECODE_HELP = "Couldn't decode that file. WAV, MP3, FLAC, M4A, and most MP4 audio tracks work in this browser. If this MP4 keeps its audio in a codec the browser won't unpack, bounce it to WAV first.";
async function loadFile(file) {
	if (file.size > 104857600) {
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
		const channels = [];
		for (let c = 0; c < audio.numberOfChannels; c++) channels.push(new Float32Array(audio.getChannelData(c)));
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
async function togglePlay() {
	await getCtx().resume();
	if (!engine.buffer) return;
	if (engine.playing) {
		engine.anchorSource = sourceTime();
		engine.playing = false;
		stopSource();
		emit();
		return;
	}
	const dur = engine.buffer.duration;
	startAt(engine.anchorSource >= dur - .05 ? 0 : engine.anchorSource);
}
function stopTransport() {
	engine.anchorSource = 0;
	engine.playing = false;
	stopSource();
	emit();
}
function seekRatio(ratio) {
	if (!engine.buffer) return;
	const t = Math.min(1, Math.max(0, ratio)) * engine.buffer.duration;
	if (engine.playing) startAt(t);
	else {
		engine.anchorSource = t;
		emit();
	}
}
function setReadRate(rate) {
	if (!(rate > 0) || !Number.isFinite(rate)) return;
	if (engine.readRate === rate) return;
	const position = sourceTime();
	engine.readRate = rate;
	engine.anchorSource = position;
	engine.anchorCtx = engine.ctx?.currentTime ?? 0;
	if (engine.source) engine.source.playbackRate.setValueAtTime(rate, engine.anchorCtx);
}
function setVolume(volume) {
	const next = Math.min(1, Math.max(0, volume));
	engine.volume = next;
	if (engine.gain && engine.ctx) engine.gain.gain.setValueAtTime(next, engine.ctx.currentTime);
	else if (engine.gain) engine.gain.gain.value = next;
}
async function bounce(rate, bits, onProgress) {
	const pcm = engine.pcm;
	if (!pcm || !pcm[0]) throw new Error("Nothing is loaded.");
	const frames = outputFrameCount(pcm[0].length, rate);
	if (frames * pcm.length > 32e6) throw new Error("That ratio makes a file this page can't hold. Move the speeds closer, or use a shorter source.");
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
var PRESETS = [
	{
		id: "hear",
		label: "Hear 33⅓",
		detail: "Cut at 33.50, played at 33⅓",
		cut: RPM_33_50,
		play: RPM_33_1_3
	},
	{
		id: "restore",
		label: "Restore",
		detail: "Captured at 33.50, back to 33⅓",
		cut: RPM_33_1_3,
		play: RPM_33_50
	},
	{
		id: "locked",
		label: "Locked",
		detail: "Both at 33⅓. The file, untouched",
		cut: RPM_33_1_3,
		play: RPM_33_1_3
	}
];
function near(a, b) {
	return Math.abs(a - b) < 1e-9;
}
function formatRpm(rpm) {
	if (near(rpm, 33.333333333333336)) return "33⅓";
	if (near(rpm, 33.5)) return "33.50";
	return rpm.toFixed(2);
}
function formatRate(rate) {
	if (near(rate, 200 / 201)) return "200/201";
	if (near(rate, 201 / 200)) return "201/200";
	if (near(rate, 1)) return "1/1";
	return rate.toFixed(6);
}
function formatTime(seconds) {
	if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
	const whole = Math.floor(seconds);
	return `${Math.floor(whole / 60)}:${(whole % 60).toString().padStart(2, "0")}`;
}
function formatSigned(value, digits, suffix) {
	const body = Math.abs(value).toFixed(digits);
	if (value > 0) return `+${body}${suffix}`;
	if (value < 0) return `−${body}${suffix}`;
	return `${body}${suffix}`;
}
function downloadText(text, filename, type) {
	const url = URL.createObjectURL(new Blob([text], { type }));
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	URL.revokeObjectURL(url);
}
function downloadBytes(bytes, filename) {
	const copy = new Uint8Array(bytes.byteLength);
	copy.set(bytes);
	const url = URL.createObjectURL(new Blob([copy], { type: "audio/wav" }));
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	URL.revokeObjectURL(url);
}
function exportBase(name) {
	return name.replace(/\.[^.]+$/, "").replace(/[^\w.-]+/g, "_") || "spindle";
}
function RpmControl({ label, value, min, max, onChange }) {
	const clamp = (next) => Math.min(max, Math.max(min, Math.round(next * 100) / 100));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-2 flex items-baseline justify-between gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-sm text-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-mono text-sm tabular-nums text-fg",
			children: formatRpm(value)
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "h-11 w-11 shrink-0 rounded-full border border-border text-fg",
				onClick: () => onChange(clamp(value - .01)),
				"aria-label": `${label} down one hundredth`,
				children: "−"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Slider, {
				className: "relative flex h-11 min-w-0 flex-1 touch-none items-center",
				min,
				max,
				step: .01,
				value: [value],
				"aria-valuetext": formatRpm(value),
				onValueChange: (next) => {
					const rpm = next[0];
					if (rpm !== void 0) onChange(rpm);
				},
				"aria-label": label,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderTrack, {
					className: "relative h-px grow bg-border",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRange, { className: "absolute h-px bg-fg" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderThumb, { className: "block size-4 rounded-full border border-ink bg-label" })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "h-11 w-11 shrink-0 rounded-full border border-border text-fg",
				onClick: () => onChange(clamp(value + .01)),
				"aria-label": `${label} up one hundredth`,
				children: "+"
			})
		]
	})] });
}
function Groove({ peaks, sampleRate, frames, readRate }) {
	const [source, setSource] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-2 flex flex-wrap justify-between gap-2 font-mono text-xs tabular-nums text-muted",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
			"Groove ",
			formatTime(source),
			" / ",
			formatTime(duration)
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
			"Heard ",
			formatTime(heard),
			" / ",
			formatTime(heardDuration)
		] })]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Waveform, {
		peaks,
		progress,
		onSeek: seekRatio
	})] });
}
function Bench() {
	const snap = (0, import_react.useSyncExternalStore)(subscribe, getSnapshot, getServerSnapshot);
	const [cut, setCut] = (0, import_react.useState)(RPM_33_50);
	const [play, setPlay] = (0, import_react.useState)(RPM_33_1_3);
	const [original, setOriginal] = (0, import_react.useState)(false);
	const [level, setLevel] = (0, import_react.useState)(.8);
	const [wide, setWide] = (0, import_react.useState)(false);
	const [over, setOver] = (0, import_react.useState)(false);
	const [exporting, setExporting] = (0, import_react.useState)(false);
	const [exportProgress, setExportProgress] = (0, import_react.useState)(0);
	const [exportError, setExportError] = (0, import_react.useState)(null);
	const programmed = describeSpeed(cut, play);
	const hearing = original ? describeSpeed(cut, cut) : programmed;
	const needsWide = cut < 32 || cut > 35 || play < 32 || play > 35;
	const rangeWide = wide || needsWide;
	const min = rangeWide ? 16 : 32;
	const max = rangeWide ? 90 : 35;
	(0, import_react.useEffect)(() => {
		if (!isReady()) loadLacquer();
	}, []);
	(0, import_react.useEffect)(() => {
		setReadRate(hearing.readRate);
	}, [hearing.readRate]);
	(0, import_react.useEffect)(() => {
		setVolume(level);
	}, [level]);
	(0, import_react.useEffect)(() => {
		const onKey = (event) => {
			if (event.code !== "Space") return;
			const target = event.target;
			if (target instanceof HTMLElement) {
				const tag = target.tagName;
				if (tag === "BUTTON" || tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) return;
			}
			event.preventDefault();
			togglePlay();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);
	async function onExport(bits) {
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		onDragOver: (event) => {
			event.preventDefault();
			setOver(true);
		},
		onDragLeave: () => setOver(false),
		onDrop: (event) => {
			event.preventDefault();
			setOver(false);
			const file = event.dataTransfer.files[0];
			if (file) loadFile(file);
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-mono text-xs tracking-wide text-subtle",
				children: "VARISPEED"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 font-display text-4xl leading-tight tracking-tight",
				children: "Spindle"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 max-w-prose text-base leading-relaxed text-muted",
				children: [
					"Play a file the way a turntable would if the lacquer was cut at one speed and the platter in the room ran at another. The default treats your audio as a 33.50 cut and listens at 33⅓: rate ",
					formatRate(200 / 201),
					",",
					" ",
					formatSigned(describeSpeed(RPM_33_50, RPM_33_1_3).cents, 2, " cents"),
					", and the side grows by exactly half a percent."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 grid items-center gap-8 lg:grid-cols-[18rem_minmax(0,1fr)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Platter, {
					rpm: original ? cut : play,
					label: formatRpm(original ? cut : play),
					playing: snap.playing
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-center text-sm text-muted",
					children: original ? "Hearing the file" : `Hearing ${formatRpm(play)}`
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid gap-2 sm:grid-cols-3",
							children: PRESETS.map((preset) => {
								const active = near(cut, preset.cut) && near(play, preset.play);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									"aria-pressed": active,
									onClick: () => {
										setCut(preset.cut);
										setPlay(preset.play);
										setOriginal(false);
									},
									className: active ? "min-h-11 rounded-lg bg-label px-3 py-2 text-left text-ink" : "min-h-11 rounded-lg border border-border bg-bg-elevated px-3 py-2 text-left text-fg",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block text-sm font-medium",
										children: preset.label
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: active ? "mt-1 block text-xs text-ink/80" : "mt-1 block text-xs text-muted",
										children: preset.detail
									})]
								}, preset.id);
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: "Read rate",
									value: formatRate(hearing.readRate)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: "Pitch",
									value: formatSigned(hearing.cents, 2, " cents")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: "A440 lands",
									value: `${hearing.a440Hz.toFixed(2)} Hz`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: "Duration",
									value: hearing.durationScale === 1.005 ? "×1.005" : `×${hearing.durationScale.toFixed(4)}`
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 flex flex-wrap items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "inline-flex h-11 items-center gap-2 rounded-full bg-label px-5 font-medium text-ink disabled:opacity-40",
									onClick: () => void togglePlay(),
									disabled: !snap.ready,
									children: [snap.playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-4" }), snap.playing ? "Pause" : "Play"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "inline-flex h-11 items-center gap-2 rounded-full border border-border px-4 text-fg disabled:opacity-40",
									onClick: () => stopTransport(),
									disabled: !snap.ready,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, { className: "size-4" }), "Stop"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-pressed": original,
									className: original ? "inline-flex h-11 items-center rounded-full bg-fg px-4 font-medium text-ink" : "inline-flex h-11 items-center rounded-full border border-border px-4 text-fg",
									onClick: () => setOriginal((value) => !value),
									children: original ? "Back to preset" : "Hear original"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-subtle",
							children: "Space plays and pauses. Hear original is the bypass, for the A/B."
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 rounded-xl border border-border bg-bg-elevated p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Groove, {
					peaks: snap.peaks,
					sampleRate: snap.sampleRate,
					frames: snap.frames,
					readRate: hearing.readRate
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex flex-wrap items-baseline justify-between gap-2 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "min-w-0 truncate text-fg",
						title: snap.name,
						children: [snap.ready ? snap.name : "Loading the reference lacquer", snap.kind === "lacquer" ? " — 440 Hz, then a phrase" : ""]
					}), snap.ready ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-mono text-xs tabular-nums text-muted",
						children: [
							snap.channels,
							" ch · ",
							snap.sampleRate,
							" Hz"
						]
					}) : null]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 grid gap-6 lg:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl border border-border p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-4 flex items-center justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-sm font-medium text-fg",
								children: "Trim"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-pressed": rangeWide,
								disabled: needsWide,
								className: "h-11 rounded-full border border-border px-3 text-sm text-muted disabled:opacity-60",
								onClick: () => setWide((value) => !value),
								children: needsWide ? "Full range" : rangeWide ? "Narrow to 32–35" : "Open 16–90"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RpmControl, {
								label: "Cut RPM",
								value: cut,
								min,
								max,
								onChange: setCut
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RpmControl, {
								label: "Play RPM",
								value: play,
								min,
								max,
								onChange: setPlay
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-2 flex items-baseline justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sm text-muted",
									children: "Level"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-sm tabular-nums text-fg",
									children: Math.round(level * 100)
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Slider, {
								className: "relative flex h-11 touch-none items-center",
								min: 0,
								max: 1,
								step: .01,
								value: [level],
								onValueChange: (next) => {
									const value = next[0];
									if (value !== void 0) setLevel(value);
								},
								"aria-label": "Level",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderTrack, {
									className: "relative h-px grow bg-border",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRange, { className: "absolute h-px bg-fg" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderThumb, { className: "block size-4 rounded-full border border-ink bg-label" })]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm text-subtle",
							children: "Presets use 100/3, not the truncation 33.33. Drag if you want the two-decimal number. 16⅔, 45, and 78 are in the wide range. Same kernel."
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: over ? "rounded-xl border border-fg bg-bg-subtle p-4" : "rounded-xl border border-border p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-sm font-medium text-fg",
							children: "Source and bounce"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm leading-relaxed text-muted",
							children: "Drop a WAV, MP3, FLAC, M4A, or MP4. Video MP4s contribute their audio track when the browser can unpack it. Listening uses the browser resampler. The WAV bounce uses the cubic Hermite kernel the VST note transcribes. Speed only — no crackle, wow, or RIAA."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "mt-4 flex h-11 cursor-pointer items-center justify-center rounded-full border border-border text-sm text-fg",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "file",
								accept: ".wav,.mp4,.m4a,.mp3,.flac,.ogg,.aac,audio/*,video/mp4",
								className: "sr-only",
								onChange: (event) => {
									const file = event.target.files?.[0];
									if (file) loadFile(file);
									event.target.value = "";
								}
							}), "Choose a file"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "h-11 rounded-full bg-label px-4 text-sm font-medium text-ink disabled:opacity-40",
									disabled: !snap.ready || exporting,
									onClick: () => void onExport(24),
									children: exporting ? `Bouncing ${Math.round(exportProgress * 100)}%` : "Export 24-bit WAV"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "h-11 rounded-full border border-border px-4 text-sm text-fg disabled:opacity-40",
									disabled: !snap.ready || exporting,
									onClick: () => void onExport(16),
									children: "16-bit"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "h-11 rounded-full border border-border px-4 text-sm text-fg",
									onClick: () => downloadText(vinylSpeed_default, "spindle-vinylSpeed.ts", "text/typescript"),
									children: "Download plugin"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "h-11 rounded-full border border-border px-4 text-sm text-muted",
									onClick: () => void loadLacquer(),
									children: "Reference lacquer"
								})
							]
						}),
						exportError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm text-danger",
							children: exportError
						}) : null,
						snap.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm text-danger",
							children: snap.error
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-4 text-sm text-muted",
							children: [
								"Export follows the preset, even while Original is up.",
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/notes",
									className: "text-fg underline decoration-border underline-offset-4",
									children: "Why 33⅓ won, and how to port the kernel"
								}),
								"."
							]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-6 font-mono text-xs text-subtle",
				children: [
					"Kernel parameters ",
					PARAMETERS.map((item) => item.id).join(" · "),
					" · docs in the Notes"
				]
			})
		]
	});
}
function Stat({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-md bg-bg-elevated px-3 py-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-subtle",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 font-mono text-sm tabular-nums text-fg sm:text-base",
			children: value
		})]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bench, {}) });
}
//#endregion
export { Home as component };
