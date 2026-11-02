import type { Metadata } from "next";
import { AuthForm } from "@/components/layout/AuthForm";
export const metadata: Metadata = { title: "Sign in", robots: { index: false } };
export default function LoginPage() { return <main className="relative grid min-h-[calc(100vh-72px)] place-items-center overflow-hidden px-4 py-12"><div className="riso-blob -left-20 top-20 h-72 w-72 bg-riso-yellow" /><div className="riso-blob -right-16 bottom-10 h-80 w-80 bg-riso-pink" /><div className="relative z-10"><AuthForm mode="login" /></div></main>; }
