"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultContent, defaultDesign, type BuilderSnapshot, type ContentType, type ContentValues, type QrDesign } from "@/lib/qr/types";
import { applyPreset as getPreset } from "@/lib/qr/presets";

export type BuilderState = BuilderSnapshot & {
  dynamic: boolean; savedId: string | null; past: BuilderSnapshot[]; future: BuilderSnapshot[];
  setType: (type: ContentType) => void;
  setValue: <K extends keyof ContentValues>(key: K, value: ContentValues[K]) => void;
  setDesign: (design: Partial<QrDesign>) => void;
  setName: (name: string) => void;
  setDynamic: (dynamic: boolean) => void;
  applyPreset: (id: string) => void;
  load: (snapshot: BuilderSnapshot & { dynamic?: boolean; savedId?: string | null }) => void;
  undo: () => void; redo: () => void; reset: () => void;
};

const clone = (value: BuilderSnapshot): BuilderSnapshot => structuredClone(value);

export const useBuilderStore = create<BuilderState>()(persist((set, get) => {
  const snapshot = (): BuilderSnapshot => ({ content: get().content, design: get().design, name: get().name });
  const commit = (next: Partial<BuilderSnapshot>) => set((state) => ({ ...next, past: [...state.past.slice(-39), clone(snapshot())], future: [] }));
  return {
    content: structuredClone(defaultContent), design: { ...defaultDesign }, name: "Untitled studio code", dynamic: false, savedId: null, past: [], future: [],
    setType: (type) => { if (type === "multilink") set({ dynamic: true }); commit({ content: { ...get().content, type } }); },
    setValue: (key, value) => commit({ content: { ...get().content, values: { ...get().content.values, [key]: value } } }),
    setDesign: (design) => commit({ design: { ...get().design, ...design, preset: design.preset ?? "Custom" } }),
    setName: (name) => set({ name }),
    setDynamic: (dynamic) => set({ dynamic }),
    applyPreset: (id) => commit({ design: { ...get().design, ...getPreset(id) } }),
    load: (value) => set({ content: structuredClone(value.content), design: { ...value.design }, name: value.name, dynamic: value.dynamic ?? false, savedId: value.savedId ?? null, past: [], future: [] }),
    undo: () => { const state = get(); const previous = state.past.at(-1); if (!previous) return; set({ ...clone(previous), past: state.past.slice(0, -1), future: [clone(snapshot()), ...state.future].slice(0, 40) }); },
    redo: () => { const state = get(); const next = state.future[0]; if (!next) return; set({ ...clone(next), past: [...state.past, clone(snapshot())], future: state.future.slice(1) }); },
    reset: () => set({ content: structuredClone(defaultContent), design: { ...defaultDesign }, name: "Untitled studio code", dynamic: false, savedId: null, past: [], future: [] }),
  };
}, { name: "qrforge-builder-v1", partialize: (state) => ({ content: state.content, design: state.design, name: state.name, dynamic: state.dynamic }) }));
