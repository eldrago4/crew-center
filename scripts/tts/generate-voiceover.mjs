/**
 * ElevenLabs TTS generator — Indian Virtual "Career Mode" voiceover.
 *
 * Voice: Will (premade, relaxed optimist, male US).
 * Target: audio locked to exactly 1:32 (92.0s).
 *
 * Duration is controlled by tuning the speech `speed` and the closing beat,
 * measured exactly via the /with-timestamps endpoint (no ffmpeg needed).
 *
 * Usage:
 *   ELEVENLABS_API_KEY=sk_... node scripts/tts/generate-voiceover.mjs
 *
 * Output: scripts/tts/indian-virtual-career-mode.mp3
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("Missing ELEVENLABS_API_KEY environment variable.");
  process.exit(1);
}

const VOICE_ID = "bIHbv24MWmeRgasZH58o"; // Will - Relaxed Optimist (premade, male US)
const MODEL_ID = "eleven_multilingual_v2"; // honors <break> tags
const OUTPUT_FORMAT = "mp3_44100_128";
const TARGET = 92.0; // seconds (1:32)
const TOLERANCE = 0.15; // acceptable |measured - TARGET|

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, "indian-virtual-career-mode.mp3");

// Fixed in-body pauses (from the script's [Pause] cues).
const P = 0.6;
// CLOSING is the adjustable beat (the "[One full beat]") used to land TARGET.
function buildScript(closing) {
  return `This is Indian Virtual's Career Mode. Not a logbook, not a leaderboard—an airline career you actually fly. <break time="${P}s" /> Every sector you file lands here: hours, earnings, status.

Your roster is real. An assigned tail, and legs flown in sequence—Mumbai to Delhi, Delhi to Doha, and back. Miss one, and the chain waits for you.

Pick a leg, and the portal briefs it. One click hands the route to SimBrief: cost-index routing, live winds, fuel and payload for your exact aircraft. No spreadsheets. No copy-paste. <break time="${P}s" />

Dispatch releases the flight, and the OFP opens right inside the portal.

Block out, wheels off, block in. Trip fuel, contingency, alternate. Route, waypoints, cruise level—the full plan, briefed the way the real thing is.

Then the numbers that actually matter on the day. Departure runway and winds. V1. Rotate. V2. Flex thrust, packs, anti-ice, limit weights—computed for this leg, on this runway, in this weather.

Briefing charts are generated with the flight: significant weather, upper winds, the enroute track, and every plate for departure and arrival. Everything you need before pushback, in one place.

And the part most virtual airlines never show you—your cabin. Passengers. Seats sold. Load factor. Because payload is money.

After landing, the P and L. Revenue against fuel, airport charges, navigation, crew and catering. Operating profit, margin, RASK and CASK—real airline economics, on your flight. Fly it well, and Indian Virtual grows with you. <break time="${closing}s" /> This is Indian Virtual's Career Mode. Come fly a line.`;
}

async function synth(text, speed) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps?output_format=${OUTPUT_FORMAT}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
        speed,
      },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ElevenLabs API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  const ends = data.alignment?.character_end_times_seconds || [];
  const duration = ends.length ? ends[ends.length - 1] : 0;
  const buf = Buffer.from(data.audio_base64, "base64");
  return { duration, buf };
}

async function main() {
  let speed = 1.0;
  let closing = 1.4;
  let best = null;

  for (let i = 1; i <= 6; i++) {
    const text = buildScript(closing);
    const { duration, buf } = await synth(text, speed);
    const diff = duration - TARGET;
    console.log(
      `pass ${i}: speed=${speed.toFixed(3)} closing=${closing.toFixed(2)}s -> ${duration.toFixed(2)}s (diff ${diff >= 0 ? "+" : ""}${diff.toFixed(2)})`
    );
    if (!best || Math.abs(duration - TARGET) < Math.abs(best.duration - TARGET)) {
      best = { duration, buf, speed, closing };
    }
    if (Math.abs(diff) <= TOLERANCE) break;

    // Speech-only length at this speed (total minus the pauses we injected).
    const injected = 2 * P + closing;
    const speech = duration - injected;

    if (Math.abs(diff) > 1.0) {
      // Coarse: retune speed so speech fits TARGET minus a nominal 1.4s closing.
      const targetSpeech = TARGET - (2 * P + 1.4);
      speed = Math.min(1.2, Math.max(0.7, speed * (speech / targetSpeech)));
      closing = 1.4;
    } else {
      // Fine: keep speed, absorb the remainder into the closing beat.
      closing = Math.min(4.0, Math.max(0.3, closing - diff));
    }
  }

  writeFileSync(OUTPUT_PATH, best.buf);
  console.log(
    `\nFINAL: ${best.duration.toFixed(2)}s  (speed=${best.speed.toFixed(3)}, closing=${best.closing.toFixed(2)}s)`
  );
  console.log(`Wrote ${best.buf.length} bytes -> ${OUTPUT_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
