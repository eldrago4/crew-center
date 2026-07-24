"use client";

import { useMemo } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { DotLottie } from "@lottiefiles/dotlottie-web";
import aigAnimation from "./aig-lottie.json";

// The AI.g pixel-sprite loader, rendered with dotLottie's WASM engine (a
// different renderer from lottie-web, which never showed in-app). This module
// is only loaded via next/dynamic({ ssr: false }), so the WASM/canvas engine
// never touches the server.
//
// Self-host the engine WASM: dotLottie otherwise fetches ~1.8 MB from
// cdn.jsdelivr.net at runtime, which is a hard dependency on an external origin
// (and a CSP risk on Cloudflare). We copied dist/dotlottie-player.wasm into
// public/, so it's served by the Workers ASSETS binding from our own domain.
DotLottie.setWasmUrl("/dotlottie-player.wasm");

// Pass the animation as an immutable JSON *string* (memoised): the static JSON
// import is a frozen module singleton, and handing a player a live object it
// might tag/mutate is what silently broke the lottie-web path.
export default function AigLottie() {
  const data = useMemo(() => JSON.stringify(aigAnimation), []);
  return (
    <DotLottieReact
      data={data}
      loop
      autoplay
      aria-hidden="true"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
