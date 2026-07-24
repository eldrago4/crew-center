"use client";

import { useMemo } from "react";
import Lottie from "lottie-react";
import aigAnimation from "./aig-lottie.json";

// The AI.g pixel-sprite loader. lottie-react wraps the same lottie-web engine,
// which MUTATES the animationData it's handed (tags it `completed`, stores
// per-frame render state). A statically-imported JSON module is a frozen,
// shared singleton, so passing `aigAnimation` straight in throws "Cannot add
// property completed, object is not extensible" and the animation never shows.
// Hand it a fresh mutable copy, memoised so the reference is stable across
// renders (a new object each render would make Lottie tear down and reload).
//
// This module is only ever loaded via `next/dynamic(..., { ssr: false })`, so
// lottie-web never evaluates during SSR — no window/document access on the
// server, no hydration mismatch.
export default function AigLottie() {
  const animationData = useMemo(() => structuredClone(aigAnimation), []);
  return (
    <Lottie
      animationData={animationData}
      loop
      autoplay
      aria-hidden="true"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
