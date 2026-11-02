import type { Metadata } from "next";
import { PricingView } from "@/components/layout/PricingView";
export const metadata: Metadata = { title: "Pricing & honest plan limits", description: "Unlimited static QR creation, clear dynamic-code and bulk limits, and a simulated Pro gateway that never collects card data." };
export default function PricingPage() { return <PricingView />; }
