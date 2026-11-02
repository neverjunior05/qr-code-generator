"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { GoogleLogo, Key, ArrowRight } from "@phosphor-icons/react";
import { useEffect, useState, type FormEvent } from "react";
import { useToast } from "@/components/providers";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter(); const toast = useToast(); const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const [resetMode, setResetMode] = useState(false); const [resetToken, setResetToken] = useState<{ uid: string; expires: number; token: string } | null>(null);
  useEffect(() => { const query = new URLSearchParams(window.location.search); if (query.get("reset")) { setResetMode(true); setResetToken({ uid: query.get("uid") || "", expires: Number(query.get("expires")), token: query.get("token") || "" }); } if (query.get("google")) setError("Google OAuth is not configured in this local demo. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, or use a demo account."); }, []);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setLoading(true); setError(""); const form = new FormData(event.currentTarget);
    try {
      if (resetMode && resetToken) {
        const response = await fetch("/api/auth/reset", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...resetToken, password: form.get("password") }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error); toast("Password reset. Sign in with your new password."); setResetMode(false); setResetToken(null); router.replace("/login"); return;
      }
      if (resetMode) { const response = await fetch("/api/auth/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email") }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error); toast(body.message, "info"); return; }
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload = mode === "login" ? { email: form.get("email"), password: form.get("password") } : { name: form.get("name"), email: form.get("email"), password: form.get("password") };
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); const body = await response.json(); if (!response.ok) throw new Error(body.error || "Account request failed.");
      toast(mode === "login" ? `Welcome back, ${body.user.name.split(" ")[0]}` : body.message); router.push("/library"); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); } finally { setLoading(false); }
  };
  const demo = (email: string) => { const form = document.getElementById("auth-form") as HTMLFormElement; (form.elements.namedItem("email") as HTMLInputElement).value = email; (form.elements.namedItem("password") as HTMLInputElement).value = "demo1234"; };
  return <div className="print-card w-full max-w-[460px] p-6 sm:p-8">
    <p className="micro">{resetMode ? "Account recovery" : mode === "login" ? "Welcome back to the studio" : "Start your print shelf"}</p>
    <h1 className="mt-3 font-display text-3xl font-bold tracking-[-.04em]">{resetMode ? (resetToken ? "Choose a new password." : "Reset your password.") : mode === "login" ? "Sign in, make something." : "Create your account."}</h1>
    <p className="mt-3 text-sm leading-6 text-muted">Static generation and exports never require an account. Sign in only for dynamic links, scan analytics, folders, and your library.</p>
    <form id="auth-form" onSubmit={submit} className="mt-7 grid gap-4">
      {mode === "register" && !resetMode && <div className="field"><label htmlFor="name">Your name</label><input id="name" name="name" className="input" required minLength={2} autoComplete="name" placeholder="Sam Rivera" /></div>}
      {(!resetMode || !resetToken) && <div className="field"><label htmlFor="email">Email address</label><input id="email" name="email" className="input" required type="email" autoComplete="email" placeholder="you@example.com" /></div>}
      {(!resetMode || resetToken) && <div className="field"><label htmlFor="password">{resetToken ? "New password" : "Password"}</label><input id="password" name="password" className="input" required minLength={8} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="At least 8 characters" /></div>}
      <div aria-live="polite">{error && <p role="alert" className="rounded-[10px] border border-[#F0445A]/40 bg-[#F0445A]/10 p-3 text-xs leading-5 text-[#C62E45] dark:text-[#FF9CAB]">{error}</p>}</div>
      <button className="btn btn-primary mt-1 w-full" disabled={loading}>{loading ? "Working…" : resetMode ? <><Key size={18} />{resetToken ? "Set new password" : "Log mock reset email"}</> : <>{mode === "login" ? "Sign in" : "Create account"}<ArrowRight size={18} /></>}</button>
    </form>
    {!resetMode && <><button className="btn btn-secondary mt-3 w-full" onClick={() => window.location.href = "/api/auth/google"}><GoogleLogo size={19} weight="bold" /> Continue with Google</button><button className="mx-auto mt-4 block min-h-11 text-xs font-semibold text-indigo-deep" onClick={() => setResetMode(true)}>Forgot password?</button></>}
    {mode === "login" && !resetMode && <div className="mt-5 rounded-[12px] bg-elevated p-4"><p className="micro">Fictional demo accounts</p><div className="mt-3 grid gap-2">{[["user@qrforge.test", "Free user · 36 saved codes"], ["pro@qrforge.test", "Pro user · simulated plan"], ["admin@qrforge.test", "Admin · review queue"]].map(([email, label]) => <button key={email} onClick={() => demo(email)} className="flex min-h-10 items-center justify-between rounded-lg border border-hairline bg-surface px-3 text-left text-xs hover:border-indigo"><span className="font-mono">{email}</span><span className="hidden text-[.62rem] text-muted sm:block">{label}</span></button>)}<p className="help">Password for all three: <span className="font-mono text-ink">demo1234</span></p></div></div>}
    <p className="mt-6 text-center text-xs text-muted">{resetMode ? <button className="min-h-11 font-semibold text-indigo-deep" onClick={() => { setResetMode(false); setResetToken(null); }}>Back to sign in</button> : mode === "login" ? <>New here? <Link className="font-semibold text-indigo-deep" href="/register">Create an account</Link></> : <>Already registered? <Link className="font-semibold text-indigo-deep" href="/login">Sign in</Link></>}</p>
  </div>;
}
