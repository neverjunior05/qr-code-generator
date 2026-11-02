"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";
import type { SavedCode } from "@/lib/clientTypes";

export default function AnalyticsHome() {
  const [codes, setCodes] = useState<SavedCode[]>([]); const [selected, setSelected] = useState(""); const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/codes").then(async (r) => { if (!r.ok) throw new Error(); return r.json(); }).then((d) => { const dynamic = d.codes.filter((c: SavedCode) => c.dynamic); setCodes(dynamic); if (dynamic[0]) setSelected(dynamic[0].id); }).catch(() => undefined).finally(() => setLoading(false)); }, []);
  if (loading) return <main className="mx-auto max-w-5xl p-8"><div className="skeleton h-20" /></main>;
  if (!codes.length) return <main className="grid min-h-[65vh] place-items-center px-5 text-center"><div><h1 className="font-display text-4xl font-bold">No dynamic codes yet.</h1><p className="mt-3 text-sm text-muted">Create a dynamic code or sign in to the fictional demo account.</p><Link href="/create" className="btn btn-primary mt-6">Create a code</Link></div></main>;
  return <><div className="mx-auto max-w-[1400px] px-4 pt-6 sm:px-6 lg:px-8"><select className="input max-w-md" value={selected} onChange={(e) => setSelected(e.target.value)} aria-label="Choose code for analytics">{codes.map((code) => <option key={code.id} value={code.id}>{code.name} · /{code.slug}</option>)}</select></div>{selected && <AnalyticsView codeId={selected} />}</>;
}
