/**
 * Google AI Studio (Gemini) TTS generator — Indian Virtual "Career Mode".
 *
 * Voice: Zephyr (bright, natural female), steered enthusiastic via a style
 * directive. Gemini TTS returns raw PCM, which we wrap into a WAV container.
 *
 * Usage:
 *   GEMINI_API_KEY=... node scripts/tts/generate-voiceover-gemini.mjs
 *
 * Output: scripts/tts/indian-virtual-career-mode.wav
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("Missing GEMINI_API_KEY environment variable.");
  process.exit(1);
}

const MODEL = "gemini-2.5-flash-preview-tts";
const VOICE = "Zephyr"; // bright, natural female
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, "indian-virtual-career-mode.wav");

// Style directive + narration. Gemini has no speed param, so pacing is
// steered via the leading instruction. Target ~1:35, never longer.
const prompt = `Read the following as a polished airline brand voiceover — warm, natural, and genuinely enthusiastic, at a brisk, energetic, flowing pace with steady momentum and only light pauses between sections. Do not read this instruction aloud.

This is Indian Virtual's Career Mode. Not a logbook, not a leaderboard — an airline career you actually fly. Every sector you file lands here: hours, earnings, status.

Your roster is real. An assigned tail, and legs flown in sequence — Mumbai to Delhi, Delhi to Doha, and back. Miss one, and the chain waits for you.

Pick a leg, and the portal briefs it. One click hands the route to SimBrief: cost-index routing, live winds, fuel and payload for your exact aircraft. No spreadsheets. No copy-paste.

Dispatch releases the flight, and the OFP opens right inside the portal.

Block out, wheels off, block in. Trip fuel, contingency, alternate. Route, waypoints, cruise level — the full plan, briefed the way the real thing is.

Then the numbers that actually matter on the day. Departure runway and winds. V1. Rotate. V2. Flex thrust, packs, anti-ice, limit weights — computed for this leg, on this runway, in this weather.

Briefing charts are generated with the flight: significant weather, upper winds, the enroute track, and every plate for departure and arrival. Everything you need before pushback, in one place.

And the part most virtual airlines never show you — your cabin. Passengers. Seats sold. Load factor. Because payload is money.

After landing, the P and L. Revenue against fuel, airport charges, navigation, crew and catering. Operating profit, margin, RASK and CASK — real airline economics, on your flight. Fly it well, and Indian Virtual grows with you.

This is Indian Virtual's Career Mode. Come fly a line.`;

function pcmToWav(pcm, sampleRate, channels = 1, bits = 16) {
  const blockAlign = (channels * bits) / 8;
  const byteRate = sampleRate * blockAlign;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bits, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

async function main() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-goog-api-key": API_KEY },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } },
        },
      },
    }),
  });

  const raw = await res.text();
  if (!res.ok) {
    console.error(`Gemini API error ${res.status}: ${raw}`);
    process.exit(1);
  }
  const data = JSON.parse(raw);
  const part = data?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!part) {
    console.error("No audio in response:", JSON.stringify(data).slice(0, 800));
    process.exit(1);
  }
  const mime = part.inlineData.mimeType || "";
  const rateMatch = mime.match(/rate=(\d+)/);
  const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
  const pcm = Buffer.from(part.inlineData.data, "base64");
  const wav = pcmToWav(pcm, sampleRate);
  writeFileSync(OUTPUT_PATH, wav);

  const seconds = pcm.length / (sampleRate * 2); // 16-bit mono
  const mm = Math.floor(seconds / 60);
  const ss = (seconds % 60).toFixed(1).padStart(4, "0");
  console.log(`voice=${VOICE} rate=${sampleRate}Hz  duration=${mm}:${ss} (${seconds.toFixed(2)}s)`);
  console.log(`Wrote ${wav.length} bytes -> ${OUTPUT_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
