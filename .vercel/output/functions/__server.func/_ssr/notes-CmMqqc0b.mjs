import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as vinylSpeed_default, t as Shell } from "./shell-YrhLhiay.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/notes-CmMqqc0b.js
var import_jsx_runtime = require_jsx_runtime();
function parse(source) {
	const lines = source.replace(/\r\n/g, "\n").split("\n");
	const blocks = [];
	let i = 0;
	while (i < lines.length) {
		const line = lines[i] ?? "";
		if (line.trim() === "") {
			i += 1;
			continue;
		}
		if (line.startsWith("```")) {
			const buf = [];
			i += 1;
			while (i < lines.length && !(lines[i] ?? "").startsWith("```")) {
				buf.push(lines[i] ?? "");
				i += 1;
			}
			i += 1;
			blocks.push({
				kind: "code",
				text: buf.join("\n")
			});
			continue;
		}
		const heading = /^(#{1,3})\s+(.*)$/.exec(line);
		if (heading) {
			blocks.push({
				kind: "h",
				level: heading[1]?.length ?? 1,
				text: heading[2] ?? ""
			});
			i += 1;
			continue;
		}
		if (line.startsWith("- ")) {
			const items = [];
			while (i < lines.length && (lines[i] ?? "").startsWith("- ")) {
				items.push((lines[i] ?? "").slice(2));
				i += 1;
			}
			blocks.push({
				kind: "ul",
				items
			});
			continue;
		}
		const buf = [line];
		i += 1;
		while (i < lines.length) {
			const next = lines[i] ?? "";
			if (next.trim() === "" || next.startsWith("#") || next.startsWith("```") || next.startsWith("- ")) break;
			buf.push(next);
			i += 1;
		}
		blocks.push({
			kind: "p",
			text: buf.join(" ")
		});
	}
	return blocks;
}
function inline(text) {
	const nodes = [];
	const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g;
	let cursor = 0;
	let match;
	let key = 0;
	while (match = pattern.exec(text)) {
		if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
		const token = match[0];
		if (token.startsWith("**")) nodes.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
			className: "font-medium text-fg",
			children: token.slice(2, -2)
		}, key));
		else nodes.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
			className: "font-mono text-sm text-fg",
			children: token.slice(1, -1)
		}, key));
		key += 1;
		cursor = match.index + token.length;
	}
	if (cursor < text.length) nodes.push(text.slice(cursor));
	return nodes;
}
function RichDoc({ source }) {
	const blocks = parse(source);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
		className: "max-w-prose",
		children: blocks.map((block, index) => {
			if (block.kind === "h") {
				if (block.level === 1) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-3xl leading-tight tracking-tight text-fg",
					children: inline(block.text)
				}, index);
				if (block.level === 2) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-8 font-display text-xl leading-snug tracking-tight text-fg",
					children: inline(block.text)
				}, index);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "mt-6 text-lg font-medium text-fg",
					children: inline(block.text)
				}, index);
			}
			if (block.kind === "ul") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 list-disc space-y-1 pl-5 text-muted",
				children: block.items.map((item, itemIndex) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: inline(item) }, itemIndex))
			}, index);
			if (block.kind === "code") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
				className: "mt-4 overflow-x-auto rounded-md border border-border bg-bg-elevated p-4 font-mono text-sm leading-relaxed text-fg",
				children: block.text
			}, index);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-base leading-relaxed text-muted",
				children: inline(block.text)
			}, index);
		})
	});
}
var vst_port_default = "# Porting Spindle to a VST\n\nThe plugin is one file: `src/dsp/vinylSpeed.ts`. It does not import React, the DOM, or Web Audio. A JUCE port is a transcription of that file, not a rewrite of the bench. The golden tests live in `src/dsp/vinylSpeed.test.ts`. If those still pass after the port, the plugin is Spindle.\n\n## What the DSP is\n\nA constant-ratio resampler. Output sample i reads the source at position `origin + i * readRate`, through cubic Hermite interpolation.\n\nreadRate = playRpm / cutRpm\n\nWhen readRate is 200/201, the output is longer than the input by exactly 0.5% and every partial sits 8.63 cents flat. That is the whole product. The web bench's Export button calls this same function.\n\n## What it is not\n\nA realtime insert cannot change duration. The host asks for N samples and wants N samples back, on a timeline that is not yours. Varispeed changes how many samples the program occupies.\n\nBuild one of these, in this order:\n\n1. A clip processor. The plugin holds the source buffer, the way the bench does, and the host plays it as an instrument — or you bounce offline from a button.\n2. An offline bounce. Same function, writing a new clip. This is Export WAV.\n3. Not a delay used as an insert. A fractional delay can wobble pitch, which is wow. It cannot run half a percent slow for a whole side without the buffer emptying or the host time moving.\n\nIf a DAW already plays clips with a raw resample rate and time-stretch off, setting that rate to 200/201 is this plugin. The point of the port is to make the ratio a labeled pair of controls — Cut RPM, Play RPM — instead of a mystery percent.\n\n## Parameters\n\n- `cutRpm`, \"Cut RPM\", default 33.5, range 16 to 90\n- `playRpm`, \"Play RPM\", default 100/3, range 16 to 90\n- `bypass`, default off. Bypass forces readRate to 1\n\nDo not reset the read position when the ratio changes. A jump in position is a click. Changing the step size is not, as long as the phase stays continuous: the next block starts where this one ended, and only the increment uses the new rate.\n\nSave cutRpm, playRpm, and bypass. Do not save the audio in the preset.\n\n## The kernel\n\nCopy these coefficients. Leave JUCE's Lagrange interpolator alone if the golden tests are supposed to match. Hermite is transparent at half a percent. If you later care about 33 against 45 or 78, replace the interpolator with a windowed sinc and keep the ratio math. The 200/201 tests stay either way.\n\n```\nc0 = y1\nc1 = 0.5 * (y2 - y0)\nc2 = y0 - 2.5 * y1 + 2.0 * y2 - 0.5 * y3\nc3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2)\ny  = ((c3 * t + c2) * t + c1) * t + c0\n```\n\ny0 through y3 are the source samples at floor(pos)−1, floor(pos), floor(pos)+1, and floor(pos)+2. t is the fractional part. Clamp the indices to the ends of the buffer. Do not wrap. If pos is outside the buffer, write silence.\n\nNo allocation inside the block. The caller owns the output. No hidden gain, filter, or dither in this file. Dither belongs at the integer export. In the web app that is `src/dsp/wav.ts`. In a plugin it is the host.\n\n## The block call\n\n```\ndouble rate = playRpm / cutRpm;\ndouble next = processBlock(source, output, origin, rate);\norigin = next;\n```\n\n`processBlock` writes one block and returns `origin + frames * rate`.\n\nStereo is two calls, one per channel, with the same origin and the same rate. Do not let the channels keep separate phases.\n\n`outputFrameCount(n, rate)` is `floor((n - 1) / rate) + 1`. That is how long the bounce is. The last output sample still lands on the last input sample.\n\n## A JUCE shape that stays boring\n\n- `VinylSpeed.h` and `VinylSpeed.cpp` — the transcription. Functions keep the names `readRate`, `describeSpeed`, `hermite`, `processBlock`, `outputFrameCount`.\n- The processor holds an `AudioProcessorValueTreeState` with the three parameters, plus an `AudioBuffer<float>` loaded from the editor.\n- `processBlock` either reads that buffer as a clip and fills the host buffer, or it stays empty and a bounce button runs the kernel offline. Prefer the offline bounce if you do not want to pretend an insert can change duration.\n- The editor is two sliders, three presets (Hear 33⅓, Restore, Locked), and the readouts the bench already shows: cents, where A440 lands, duration scale. The platter does not need to survive the port.\n\nReport latency as 0 when the source is a loaded clip. The interpolator looks one sample behind and two ahead, but it is not a delay line on the live input, because the live input is not the source.\n\n## Tests that must still pass\n\n- `(100/3) / 33.5` equals `200/201`, with zero double error\n- Cents equal `1200 * log2(200/201)`, which is −8.634601685044663\n- A440 lands at 437.81094527363183 Hz\n- Duration scale of that preset is exactly 1.005\n- Rate 1 reproduces the source sample for sample, including both ends\n- A 440 Hz sine resampled at 200/201 has its energy at 437.81 Hz, not at 440\n- Two half-length blocks concatenated equal one full call\n\nRun them here with the DSP tests in `src/dsp/vinylSpeed.test.ts` before you change a coefficient.\n\n## Listener versus bounce\n\nThe bench plays through the browser resampler, by setting `AudioBufferSourceNode.playbackRate`, so a knob move is instant and does not click. Export WAV, and the tests, call `processBlock`. At 200/201 they are the same musical object. They are not bitwise identical. Trust the test file for the port. Trust the bench for the ratio.\n";
var why_33_default = "# Why 33.50 lost to 33⅓\n\n33.50 was not the speed that shipped. 33⅓ was. This note is that decision, because the half percent Spindle emulates is small enough to turn into a myth and exact enough to hear.\n\n## The number people reach for\n\nSay \"LP speed\" out loud and a lot of mouths land on thirty-three and a half. 33.50 is an easy decimal. It is also where a reasonable first guess sits. A soundtrack disc had to last about as long as a reel of film, simply halving 78 wrecked the fidelity, and the speeds that felt plausible clustered between 33 and 34. Half a revolution past 33 is the one that stuck in speech.\n\nIt would have bought almost nothing you can hear as \"more record,\" and it would have cost the lock to the power line. A blank turning at 33.50 has half a percent more linear groove velocity than one turning at 33⅓. On a 12-inch side that is a rounding error next to the inner-groove problem microgroove was invented to solve. What 33.50 does not have is an integer gear.\n\n## What the motor will actually divide\n\nElectric recording locked platters to synchronous motors on the mains. A film reel and a disc that drift apart are useless, and a speed that wanders is a pitch that wanders.\n\nA 60 Hz two-pole motor runs at 3,600 RPM. A 50 Hz two-pole motor runs at 3,000. The four-pole speeds are half of those: 1,800 and 1,500.\n\n33⅓ is 100/3. It divides all four:\n\n- 3,600 / 108 = 33⅓\n- 1,800 / 54 = 33⅓\n- 3,000 / 90 = 33⅓\n- 1,500 / 45 = 33⅓\n\n108, 54, 90, and 45 are teeth you can cut. Vitaphone's soundtrack discs had to last one 1,000-foot reel of 35mm film — 16 frames to the foot, 24 frames a second, 11 minutes and 6.7 seconds — and the train that did it was 3,600 into 108. The same arithmetic shows up in the Western Electric account of the speed: something near half of 78 that would lock to 60 Hz, answered with a 54-tooth worm on an 1,800 RPM shaft.\n\n33.50 divides none of them.\n\n- 3,600 / 33.50 = 107.463 teeth\n- 1,800 / 33.50 = 53.731\n- 3,000 / 33.50 = 89.552\n- 1,500 / 33.50 = 44.776\n\nThe nearest honest neighbor on a 60 Hz motor, 3,600/107, is 33.645 RPM, not 33.50. No gear train was offering thirty-three and a half. The decimal is a sentence, not a sprocket.\n\n## The strobe agrees\n\nA lamp on the mains flashes twice a cycle. The dot count that stands still is:\n\ndots = (2 × mains frequency × 60) / RPM\n\n- 60 Hz at 33⅓ is 216 dots, exactly\n- 50 Hz at 33⅓ is 180 dots, exactly\n- 60 Hz at 33.50 is 214.925 dots\n- 50 Hz at 33.50 is 179.104 dots\n\n33⅓ is the rare consumer speed that strobes on both sides of the Atlantic. 33.50 strobes on neither. That matters once a lacquer is cut in one country and the pressing is sold in the other. Columbia's 1948 microgroove LP did not invent a speed. Stations already owned 33⅓ transcription tables from that film-and-broadcast line, and the new long sides were cut to play on them.\n\nIt is the same kind of decision as the record everyone calls a 78. A 3,600 RPM motor through 46 teeth is 78.26 RPM, which is the American figure that got rounded in the name. The gear did not round. 33⅓ is the case where the exact quotient was already speakable as a fraction, so the name and the gear survived together. 33.50 is the false friend of that fraction: half, said in place of a third.\n\n## What the half percent actually does\n\nSpindle's default is not a claim that your file was cut at 33.50. It is the emulation. Treat the file as the program on the lacquer, cut while the blank turned at 33.50, and listen as if the platter in the room turns at 33⅓.\n\nThe read rate is play divided by cut:\n\n(100/3) / 33.50 = 200/201\n\nIn double precision that quotient is exact — zero error, not \"close.\" Every output sample steps 200/201 of a source sample. Pitch and time move together. There is no time-stretch and no EQ.\n\n- Pitch moves by 1,200 × log2(200/201), which is −8.63 cents\n- Concert A moves from 440 Hz to 437.81 Hz\n- Tempo drops 0.498%\n- Duration scales by 201/200, which is exactly 1.005, so a 20:00 side becomes 20:06\n\nEight and a half cents is not a semitone. On a naked tone, A/B'd against the original, it is obvious. Against a piano it is the flatness musicians argue about. It is not wow, flutter, crackle, or the RIAA curve. Those are other machines. This one changes speed and nothing else.\n\nThe other direction is the restore. Audio that really was digitized at 33.50 comes back to 33⅓ pitch at 201/200: exactly +0.5%, and +8.63 cents. Same kernel. The ratio flips.\n\nLocked leaves both speeds at 33⅓. That is the bypass. The Original control monitors it while a preset stays parked on the knobs.\n\n## When 33.50 is still the right setting\n\nUse Hear 33⅓ when you want the historical miss on purpose: the speech-number, played on the gear-number.\n\nUse Restore when a variable deck, a hot lathe trim, or a transfer made by someone who \"put it on 33.5\" actually ran fast by that half revolution, and you want concert pitch back. Half a percent is inside the range of a tired belt or a casual trim. 33.50 is a clean rational target for that error, which is a different claim from \"the industry chose it.\"\n\nUse the trims when the real error is some other RPM. 16⅔, 45, and 78 sit in the same two knobs. The math does not change. Only the ratio does.\n\nThe standard to correct toward, when you care about the standard, is the fraction 100/3. Not the truncation 33.33. The gap between 33.33 and 100/3 is about 0.017 cents. The presets use the fraction. Drag a slider if you want the two-decimal number on purpose.\n";
function downloadText(filename, text, type = "text/markdown") {
	const url = URL.createObjectURL(new Blob([text], { type }));
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	URL.revokeObjectURL(url);
}
function Notes() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-6 flex flex-wrap gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: "#why",
					className: "inline-flex h-11 items-center rounded-full border border-border px-4 text-sm text-fg",
					children: "The speeds"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: "#port",
					className: "inline-flex h-11 items-center rounded-full border border-border px-4 text-sm text-fg",
					children: "VST port"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "h-11 rounded-full bg-label px-4 text-sm font-medium text-ink",
					onClick: () => downloadText("spindle-vinylSpeed.ts", vinylSpeed_default, "text/typescript"),
					children: "Download plugin"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "h-11 rounded-full border border-border px-4 text-sm text-fg",
					onClick: () => downloadText("spindle-notes.md", `${why_33_default.trim()}\n\n${vst_port_default.trim()}\n`),
					children: "Download notes"
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			id: "why",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RichDoc, { source: why_33_default })
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("hr", { className: "my-10 border-border" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			id: "port",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RichDoc, { source: vst_port_default })
		})
	] });
}
//#endregion
export { Notes as component };
