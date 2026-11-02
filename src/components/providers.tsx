"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, Info, X } from "@phosphor-icons/react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type Toast = { id: number; message: string; tone: "success" | "info" | "error" };
const ToastContext = createContext<(message: string, tone?: Toast["tone"]) => void>(() => undefined);
export const useToast = () => useContext(ToastContext);

export function AppProviders({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [reduced] = useReducedMotion(); const pathname = usePathname();
  const toast = useCallback((message: string, tone: Toast["tone"] = "success") => {
    const id = Date.now() + Math.random(); setToasts((items) => [...items.slice(-2), { id, message, tone }]);
    window.setTimeout(() => setToasts((items) => items.filter((t) => t.id !== id)), 3600);
  }, []);
  useEffect(() => { document.documentElement.dataset.reduceMotion = String(reduced); }, [reduced]);
  useEffect(() => { if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined); }, []);
  return <ToastContext.Provider value={toast}>
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={pathname} initial={reduced ? false : { opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? { opacity: 1 } : { opacity: 0, y: -5 }} transition={{ duration: reduced ? 0 : .18 }}>{children}</motion.div>
    </AnimatePresence>
    <div className="fixed right-4 top-4 z-[10000] grid w-[min(360px,calc(100vw-32px))] gap-2" aria-live="polite" aria-atomic="false">
      <AnimatePresence>{toasts.map((item) => <motion.div key={item.id} initial={{ opacity: 0, y: -18, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: 20 }} transition={{ type: "spring", stiffness: 430, damping: 28 }} className="print-card flex items-center gap-3 p-3 text-sm font-medium">
        {item.tone === "success" ? <CheckCircle size={21} weight="fill" color="#1DB97D" /> : <Info size={21} weight="fill" color={item.tone === "error" ? "#F0445A" : "#4F46FF"} />}
        <span className="flex-1">{item.message}</span><button className="icon-btn h-8 w-8 min-h-8 border-0" aria-label="Dismiss notification" onClick={() => setToasts((all) => all.filter((t) => t.id !== item.id))}><X size={16} /></button>
      </motion.div>)}</AnimatePresence>
    </div>
    <CursorTrail reduced={reduced} />
  </ToastContext.Provider>;
}

function CursorTrail({ reduced }: { reduced: boolean }) {
  const [dots, setDots] = useState<{ id: number; x: number; y: number }[]>([]);
  const [fine, setFine] = useState(false);
  useEffect(() => { setFine(window.matchMedia("(pointer:fine)").matches); }, []);
  useEffect(() => {
    if (!fine || reduced) return; let last = 0;
    const move = (event: MouseEvent) => { const now = performance.now(); if (now - last < 45) return; last = now; const dot = { id: now, x: event.clientX, y: event.clientY }; setDots((all) => [...all.slice(-8), dot]); window.setTimeout(() => setDots((all) => all.filter((d) => d.id !== dot.id)), 480); };
    window.addEventListener("mousemove", move, { passive: true }); return () => window.removeEventListener("mousemove", move);
  }, [fine, reduced]);
  if (!fine || reduced) return null;
  return <div className="pointer-events-none fixed inset-0 z-[9998]">{dots.map((dot) => <span key={dot.id} className="absolute h-1.5 w-1.5 rounded-[1px] bg-indigo" style={{ left: dot.x + 9, top: dot.y + 9, animation: "qf-settle .45s reverse forwards" }} />)}</div>;
}

export function ThemeControls({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState("auto"); const [reduced, setReduced] = useReducedMotion();
  useEffect(() => { setTheme(localStorage.getItem("qrforge-theme") || "auto"); }, []);
  const apply = (value: string) => {
    setTheme(value); localStorage.setItem("qrforge-theme", value);
    const dark = value === "dark" || value === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
  };
  const label = useMemo(() => theme === "auto" ? "Auto" : theme === "dark" ? "Dark" : "Light", [theme]);
  return <div className={`flex items-center ${compact ? "gap-1" : "gap-3"}`}>
    {!compact && <span className="micro">Appearance</span>}
    <button className="btn btn-ghost !min-h-9 !px-3 !py-1 text-xs" onClick={() => apply(theme === "auto" ? "light" : theme === "light" ? "dark" : "auto")} aria-label={`Theme ${label}. Activate to change.`}>{label}</button>
    <button className="btn btn-ghost !min-h-9 !px-3 !py-1 text-xs" aria-pressed={reduced} onClick={() => setReduced(!reduced)}>{reduced ? "Motion reduced" : "Reduce motion"}</button>
  </div>;
}
