import type { Metadata } from "next";
import { AuthForm } from "@/components/layout/AuthForm";
export const metadata: Metadata = { title: "Create an account", robots: { index: false } };
export default function RegisterPage() { return <main className="relative grid min-h-[calc(100vh-72px)] place-items-center overflow-hidden px-4 py-12"><div className="riso-blob -left-20 top-20 h-72 w-72 bg-riso-aqua" /><div className="relative z-10"><AuthForm mode="register" /></div></main>; }
