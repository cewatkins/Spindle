import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/shell-YrhLhiay.js
var import_jsx_runtime = require_jsx_runtime();
var vinylSpeed_default = "/**\n * Spindle varispeed kernel.\n *\n * This file is the plugin. It imports nothing. A VST port is a transcription\n * of the functions below — see docs/vst-port.md and src/dsp/vinylSpeed.test.ts.\n *\n * Model: a groove cut at `cutRpm` and heard at `playRpm` is a constant-ratio\n * resample. Output sample i reads the source at `origin + i * (playRpm / cutRpm)`.\n * Pitch and duration move together. No time-stretch, EQ, wow, or noise.\n *\n * Realtime inserts cannot change duration. Call this as a clip reader or an\n * offline bounce. Do not reset the read position when the ratio changes.\n */\n\n/** The locked standard: exactly 100/3, not the truncation 33.33. */\nexport const RPM_33_1_3 = 100 / 3;\n\n/** The decimal people say: thirty-three and a half. */\nexport const RPM_33_50 = 33.5;\n\n/**\n * (100/3) / 33.5 = 200/201.\n * Source samples advanced per output sample when a 33.50 cut is heard at 33⅓.\n * In IEEE-754 double this division is exact.\n */\nexport const READ_RATE_33_50_ON_33_1_3 = 200 / 201;\n\n/** Inverse restore: a 33.50 capture returned to 33⅓ pitch. Exactly +0.5%. */\nexport const READ_RATE_RESTORE = 201 / 200;\n\nexport const RPM_MIN = 16;\nexport const RPM_MAX = 90;\n\nexport const PARAMETERS = [\n  { id: \"cutRpm\", name: \"Cut RPM\", defaultValue: RPM_33_50, min: RPM_MIN, max: RPM_MAX },\n  { id: \"playRpm\", name: \"Play RPM\", defaultValue: RPM_33_1_3, min: RPM_MIN, max: RPM_MAX },\n] as const;\n\nexport interface SpeedReport {\n  /** Source samples consumed per output sample. Below 1 slows and flattens. */\n  readRate: number;\n  /** outputDuration / inputDuration = cutRpm / playRpm. */\n  durationScale: number;\n  /** (readRate - 1) * 100. */\n  percent: number;\n  /** 1200 * log2(readRate). */\n  cents: number;\n  /** Where a 440 Hz tone lands. */\n  a440Hz: number;\n}\n\nexport function readRate(cutRpm: number, playRpm: number): number {\n  if (!(cutRpm > 0) || !(playRpm > 0) || !Number.isFinite(cutRpm) || !Number.isFinite(playRpm)) {\n    throw new Error(\"RPM must be a positive finite number\");\n  }\n  return playRpm / cutRpm;\n}\n\nexport function describeSpeed(cutRpm: number, playRpm: number): SpeedReport {\n  const rate = readRate(cutRpm, playRpm);\n  return {\n    readRate: rate,\n    durationScale: cutRpm / playRpm,\n    percent: (rate - 1) * 100,\n    cents: 1200 * Math.log2(rate),\n    a440Hz: 440 * rate,\n  };\n}\n\n/**\n * Cubic Hermite. Copy these coefficients into the C++ port:\n *   c0 = y1\n *   c1 = 0.5 * (y2 - y0)\n *   c2 = y0 - 2.5 * y1 + 2 * y2 - 0.5 * y3\n *   c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2)\n *   y  = ((c3 * t + c2) * t + c1) * t + c0\n */\nexport function hermite(y0: number, y1: number, y2: number, y3: number, t: number): number {\n  const c0 = y1;\n  const c1 = 0.5 * (y2 - y0);\n  const c2 = y0 - 2.5 * y1 + 2 * y2 - 0.5 * y3;\n  const c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2);\n  return ((c3 * t + c2) * t + c1) * t + c0;\n}\n\n/** Frames required so the last output sample still lands inside the source. */\nexport function outputFrameCount(inputLength: number, rate: number): number {\n  if (!(rate > 0) || !Number.isFinite(rate)) throw new Error(\"readRate must be positive\");\n  if (inputLength <= 0) return 0;\n  return Math.floor((inputLength - 1) / rate) + 1;\n}\n\n/**\n * Write `output.length` samples.\n * Sample i reads `origin + i * readRate`.\n * Returns the origin for the next block: `origin + output.length * readRate`.\n * Indices clamp. Past either end, write silence. No wrap, no allocation.\n */\nexport function processBlock(\n  input: Float32Array,\n  output: Float32Array,\n  origin: number,\n  rate: number,\n): number {\n  const n = input.length;\n  const m = output.length;\n  if (!(rate > 0) || !Number.isFinite(rate)) throw new Error(\"readRate must be positive\");\n  if (n === 0) {\n    output.fill(0);\n    return origin + m * rate;\n  }\n  const last = n - 1;\n  for (let i = 0; i < m; i++) {\n    const pos = origin + i * rate;\n    if (!(pos >= 0) || pos > last) {\n      output[i] = 0;\n      continue;\n    }\n    const i1 = Math.floor(pos);\n    const t = pos - i1;\n    const i0 = i1 > 0 ? i1 - 1 : 0;\n    const base = i1 < n ? i1 : last;\n    const i2 = base < last ? base + 1 : last;\n    const i3 = base + 1 < last ? base + 2 : last;\n    output[i] = hermite(input[i0], input[base], input[i2], input[i3], t);\n  }\n  return origin + m * rate;\n}\n";
function Shell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-bg text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "border-b border-border",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "font-display text-xl tracking-tight text-fg",
					children: "Spindle"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
					className: "flex items-center gap-1 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						activeOptions: { exact: true },
						className: "rounded-full px-3 py-2 text-muted",
						activeProps: { className: "rounded-full bg-bg-subtle px-3 py-2 text-fg" },
						children: "Bench"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/notes",
						className: "rounded-full px-3 py-2 text-muted",
						activeProps: { className: "rounded-full bg-bg-subtle px-3 py-2 text-fg" },
						children: "Notes"
					})]
				})]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
			className: "mx-auto max-w-5xl px-4 py-6 sm:py-8",
			children
		})]
	});
}
//#endregion
export { vinylSpeed_default as n, Shell as t };
