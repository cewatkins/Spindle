import{r as e}from"./index-_caZWVkp.js";import{n as t,t as n}from"./shell-DgWs0r5z.js";var r=e();function i(e){let t=e.replace(/\r\n/g,`
`).split(`
`),n=[],r=0;for(;r<t.length;){let e=t[r]??``;if(e.trim()===``){r+=1;continue}if(e.startsWith("```")){let e=[];for(r+=1;r<t.length&&!(t[r]??``).startsWith("```");)e.push(t[r]??``),r+=1;r+=1,n.push({kind:`code`,text:e.join(`
`)});continue}let i=/^(#{1,3})\s+(.*)$/.exec(e);if(i){n.push({kind:`h`,level:i[1]?.length??1,text:i[2]??``}),r+=1;continue}if(e.startsWith(`- `)){let e=[];for(;r<t.length&&(t[r]??``).startsWith(`- `);)e.push((t[r]??``).slice(2)),r+=1;n.push({kind:`ul`,items:e});continue}let a=[e];for(r+=1;r<t.length;){let e=t[r]??``;if(e.trim()===``||e.startsWith(`#`)||e.startsWith("```")||e.startsWith(`- `))break;a.push(e),r+=1}n.push({kind:`p`,text:a.join(` `)})}return n}function a(e){let t=[],n=/(\*\*[^*]+\*\*|`[^`]+`)/g,i=0,a,o=0;for(;a=n.exec(e);){a.index>i&&t.push(e.slice(i,a.index));let n=a[0];n.startsWith(`**`)?t.push((0,r.jsx)(`strong`,{className:`font-medium text-fg`,children:n.slice(2,-2)},o)):t.push((0,r.jsx)(`code`,{className:`font-mono text-sm text-fg`,children:n.slice(1,-1)},o)),o+=1,i=a.index+n.length}return i<e.length&&t.push(e.slice(i)),t}function o({source:e}){let t=i(e);return(0,r.jsx)(`article`,{className:`max-w-prose`,children:t.map((e,t)=>e.kind===`h`?e.level===1?(0,r.jsx)(`h1`,{className:`font-display text-3xl leading-tight tracking-tight text-fg`,children:a(e.text)},t):e.level===2?(0,r.jsx)(`h2`,{className:`mt-8 font-display text-xl leading-snug tracking-tight text-fg`,children:a(e.text)},t):(0,r.jsx)(`h3`,{className:`mt-6 text-lg font-medium text-fg`,children:a(e.text)},t):e.kind===`ul`?(0,r.jsx)(`ul`,{className:`mt-3 list-disc space-y-1 pl-5 text-muted`,children:e.items.map((e,t)=>(0,r.jsx)(`li`,{children:a(e)},t))},t):e.kind===`code`?(0,r.jsx)(`pre`,{className:`mt-4 overflow-x-auto rounded-md border border-border bg-bg-elevated p-4 font-mono text-sm leading-relaxed text-fg`,children:e.text},t):(0,r.jsx)(`p`,{className:`mt-3 text-base leading-relaxed text-muted`,children:a(e.text)},t))})}var s=`# Porting Spindle to a VST

The plugin is one file: \`src/dsp/vinylSpeed.ts\`. It does not import React, the DOM, or Web Audio. A JUCE port is a transcription of that file, not a rewrite of the bench. The golden tests live in \`src/dsp/vinylSpeed.test.ts\`. If those still pass after the port, the plugin is Spindle.

## What the DSP is

A constant-ratio resampler. Output sample i reads the source at position \`origin + i * readRate\`, through cubic Hermite interpolation.

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

- \`cutRpm\`, "Cut RPM", default 33.5, range 16 to 90
- \`playRpm\`, "Play RPM", default 100/3, range 16 to 90
- \`bypass\`, default off. Bypass forces readRate to 1

Do not reset the read position when the ratio changes. A jump in position is a click. Changing the step size is not, as long as the phase stays continuous: the next block starts where this one ended, and only the increment uses the new rate.

Save cutRpm, playRpm, and bypass. Do not save the audio in the preset.

## The kernel

Copy these coefficients. Leave JUCE's Lagrange interpolator alone if the golden tests are supposed to match. Hermite is transparent at half a percent. If you later care about 33 against 45 or 78, replace the interpolator with a windowed sinc and keep the ratio math. The 200/201 tests stay either way.

\`\`\`
c0 = y1
c1 = 0.5 * (y2 - y0)
c2 = y0 - 2.5 * y1 + 2.0 * y2 - 0.5 * y3
c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2)
y  = ((c3 * t + c2) * t + c1) * t + c0
\`\`\`

y0 through y3 are the source samples at floor(pos)−1, floor(pos), floor(pos)+1, and floor(pos)+2. t is the fractional part. Clamp the indices to the ends of the buffer. Do not wrap. If pos is outside the buffer, write silence.

No allocation inside the block. The caller owns the output. No hidden gain, filter, or dither in this file. Dither belongs at the integer export. In the web app that is \`src/dsp/wav.ts\`. In a plugin it is the host.

## The block call

\`\`\`
double rate = playRpm / cutRpm;
double next = processBlock(source, output, origin, rate);
origin = next;
\`\`\`

\`processBlock\` writes one block and returns \`origin + frames * rate\`.

Stereo is two calls, one per channel, with the same origin and the same rate. Do not let the channels keep separate phases.

\`outputFrameCount(n, rate)\` is \`floor((n - 1) / rate) + 1\`. That is how long the bounce is. The last output sample still lands on the last input sample.

## A JUCE shape that stays boring

- \`VinylSpeed.h\` and \`VinylSpeed.cpp\` — the transcription. Functions keep the names \`readRate\`, \`describeSpeed\`, \`hermite\`, \`processBlock\`, \`outputFrameCount\`.
- The processor holds an \`AudioProcessorValueTreeState\` with the three parameters, plus an \`AudioBuffer<float>\` loaded from the editor.
- \`processBlock\` either reads that buffer as a clip and fills the host buffer, or it stays empty and a bounce button runs the kernel offline. Prefer the offline bounce if you do not want to pretend an insert can change duration.
- The editor is two sliders, three presets (Hear 33⅓, Restore, Locked), and the readouts the bench already shows: cents, where A440 lands, duration scale. The platter does not need to survive the port.

Report latency as 0 when the source is a loaded clip. The interpolator looks one sample behind and two ahead, but it is not a delay line on the live input, because the live input is not the source.

## Tests that must still pass

- \`(100/3) / 33.5\` equals \`200/201\`, with zero double error
- Cents equal \`1200 * log2(200/201)\`, which is −8.634601685044663
- A440 lands at 437.81094527363183 Hz
- Duration scale of that preset is exactly 1.005
- Rate 1 reproduces the source sample for sample, including both ends
- A 440 Hz sine resampled at 200/201 has its energy at 437.81 Hz, not at 440
- Two half-length blocks concatenated equal one full call

Run them here with the DSP tests in \`src/dsp/vinylSpeed.test.ts\` before you change a coefficient.

## Listener versus bounce

The bench plays through the browser resampler, by setting \`AudioBufferSourceNode.playbackRate\`, so a knob move is instant and does not click. Export WAV, and the tests, call \`processBlock\`. At 200/201 they are the same musical object. They are not bitwise identical. Trust the test file for the port. Trust the bench for the ratio.
`,c=`# Why 33.50 lost to 33⅓

33.50 was not the speed that shipped. 33⅓ was. This note is that decision, because the half percent Spindle emulates is small enough to turn into a myth and exact enough to hear.

## The number people reach for

Say "LP speed" out loud and a lot of mouths land on thirty-three and a half. 33.50 is an easy decimal. It is also where a reasonable first guess sits. A soundtrack disc had to last about as long as a reel of film, simply halving 78 wrecked the fidelity, and the speeds that felt plausible clustered between 33 and 34. Half a revolution past 33 is the one that stuck in speech.

It would have bought almost nothing you can hear as "more record," and it would have cost the lock to the power line. A blank turning at 33.50 has half a percent more linear groove velocity than one turning at 33⅓. On a 12-inch side that is a rounding error next to the inner-groove problem microgroove was invented to solve. What 33.50 does not have is an integer gear.

## What the motor will actually divide

Electric recording locked platters to synchronous motors on the mains. A film reel and a disc that drift apart are useless, and a speed that wanders is a pitch that wanders.

A 60 Hz two-pole motor runs at 3,600 RPM. A 50 Hz two-pole motor runs at 3,000. The four-pole speeds are half of those: 1,800 and 1,500.

33⅓ is 100/3. It divides all four:

- 3,600 / 108 = 33⅓
- 1,800 / 54 = 33⅓
- 3,000 / 90 = 33⅓
- 1,500 / 45 = 33⅓

108, 54, 90, and 45 are teeth you can cut. Vitaphone's soundtrack discs had to last one 1,000-foot reel of 35mm film — 16 frames to the foot, 24 frames a second, 11 minutes and 6.7 seconds — and the train that did it was 3,600 into 108. The same arithmetic shows up in the Western Electric account of the speed: something near half of 78 that would lock to 60 Hz, answered with a 54-tooth worm on an 1,800 RPM shaft.

33.50 divides none of them.

- 3,600 / 33.50 = 107.463 teeth
- 1,800 / 33.50 = 53.731
- 3,000 / 33.50 = 89.552
- 1,500 / 33.50 = 44.776

The nearest honest neighbor on a 60 Hz motor, 3,600/107, is 33.645 RPM, not 33.50. No gear train was offering thirty-three and a half. The decimal is a sentence, not a sprocket.

## The strobe agrees

A lamp on the mains flashes twice a cycle. The dot count that stands still is:

dots = (2 × mains frequency × 60) / RPM

- 60 Hz at 33⅓ is 216 dots, exactly
- 50 Hz at 33⅓ is 180 dots, exactly
- 60 Hz at 33.50 is 214.925 dots
- 50 Hz at 33.50 is 179.104 dots

33⅓ is the rare consumer speed that strobes on both sides of the Atlantic. 33.50 strobes on neither. That matters once a lacquer is cut in one country and the pressing is sold in the other. Columbia's 1948 microgroove LP did not invent a speed. Stations already owned 33⅓ transcription tables from that film-and-broadcast line, and the new long sides were cut to play on them.

It is the same kind of decision as the record everyone calls a 78. A 3,600 RPM motor through 46 teeth is 78.26 RPM, which is the American figure that got rounded in the name. The gear did not round. 33⅓ is the case where the exact quotient was already speakable as a fraction, so the name and the gear survived together. 33.50 is the false friend of that fraction: half, said in place of a third.

## What the half percent actually does

Spindle's default is not a claim that your file was cut at 33.50. It is the emulation. Treat the file as the program on the lacquer, cut while the blank turned at 33.50, and listen as if the platter in the room turns at 33⅓.

The read rate is play divided by cut:

(100/3) / 33.50 = 200/201

In double precision that quotient is exact — zero error, not "close." Every output sample steps 200/201 of a source sample. Pitch and time move together. There is no time-stretch and no EQ.

- Pitch moves by 1,200 × log2(200/201), which is −8.63 cents
- Concert A moves from 440 Hz to 437.81 Hz
- Tempo drops 0.498%
- Duration scales by 201/200, which is exactly 1.005, so a 20:00 side becomes 20:06

Eight and a half cents is not a semitone. On a naked tone, A/B'd against the original, it is obvious. Against a piano it is the flatness musicians argue about. It is not wow, flutter, crackle, or the RIAA curve. Those are other machines. This one changes speed and nothing else.

The other direction is the restore. Audio that really was digitized at 33.50 comes back to 33⅓ pitch at 201/200: exactly +0.5%, and +8.63 cents. Same kernel. The ratio flips.

Locked leaves both speeds at 33⅓. That is the bypass. The Original control monitors it while a preset stays parked on the knobs.

## When 33.50 is still the right setting

Use Hear 33⅓ when you want the historical miss on purpose: the speech-number, played on the gear-number.

Use Restore when a variable deck, a hot lathe trim, or a transfer made by someone who "put it on 33.5" actually ran fast by that half revolution, and you want concert pitch back. Half a percent is inside the range of a tired belt or a casual trim. 33.50 is a clean rational target for that error, which is a different claim from "the industry chose it."

Use the trims when the real error is some other RPM. 16⅔, 45, and 78 sit in the same two knobs. The math does not change. Only the ratio does.

The standard to correct toward, when you care about the standard, is the fraction 100/3. Not the truncation 33.33. The gap between 33.33 and 100/3 is about 0.017 cents. The presets use the fraction. Drag a slider if you want the two-decimal number on purpose.
`;function l(e,t,n=`text/markdown`){let r=URL.createObjectURL(new Blob([t],{type:n})),i=document.createElement(`a`);i.href=r,i.download=e,i.click(),URL.revokeObjectURL(r)}function u(){return(0,r.jsxs)(n,{children:[(0,r.jsxs)(`div`,{className:`mb-6 flex flex-wrap gap-2`,children:[(0,r.jsx)(`a`,{href:`#why`,className:`inline-flex h-11 items-center rounded-full border border-border px-4 text-sm text-fg`,children:`The speeds`}),(0,r.jsx)(`a`,{href:`#port`,className:`inline-flex h-11 items-center rounded-full border border-border px-4 text-sm text-fg`,children:`VST port`}),(0,r.jsx)(`button`,{type:`button`,className:`h-11 rounded-full bg-label px-4 text-sm font-medium text-ink`,onClick:()=>l(`spindle-vinylSpeed.ts`,t,`text/typescript`),children:`Download plugin`}),(0,r.jsx)(`button`,{type:`button`,className:`h-11 rounded-full border border-border px-4 text-sm text-fg`,onClick:()=>l(`spindle-notes.md`,`${c.trim()}\n\n${s.trim()}\n`),children:`Download notes`})]}),(0,r.jsx)(`section`,{id:`why`,children:(0,r.jsx)(o,{source:c})}),(0,r.jsx)(`hr`,{className:`my-10 border-border`}),(0,r.jsx)(`section`,{id:`port`,children:(0,r.jsx)(o,{source:s})})]})}export{u as component};