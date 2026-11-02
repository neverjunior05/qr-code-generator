"use client";

import { useEffect, useState } from "react";

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { const override = localStorage.getItem("qrforge-reduce-motion"); setReduced(override ? override === "true" : media.matches); };
    update(); media.addEventListener("change", update); window.addEventListener("qrforge-motion", update);
    return () => { media.removeEventListener("change", update); window.removeEventListener("qrforge-motion", update); };
  }, []);
  return [reduced, (value: boolean) => { localStorage.setItem("qrforge-reduce-motion", String(value)); document.documentElement.dataset.reduceMotion = String(value); window.dispatchEvent(new Event("qrforge-motion")); setReduced(value); }] as const;
}
