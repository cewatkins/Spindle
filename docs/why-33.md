# Why 33.50 lost to 33⅓

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
