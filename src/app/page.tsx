import { LandingExperience } from "@/components/landing/LandingExperience";

export default function HomePage() {
  const faq = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [
    { "@type": "Question", name: "Is QRForge free without an account?", acceptedAnswer: { "@type": "Answer", text: "Yes. Static generation, live styling, scan checks, the private reader, and PNG, SVG, PDF, and clipboard exports work without signing in." } },
    { "@type": "Question", name: "What is the difference between static and dynamic QR codes?", acceptedAnswer: { "@type": "Answer", text: "Static codes contain their final payload and work independently. Dynamic codes contain a QRForge short link that can be edited and measured, but depend on the service and account remaining active." } },
    { "@type": "Question", name: "Does QRForge store visitor IP addresses?", acceptedAnswer: { "@type": "Answer", text: "No. The demo stores a salted daily-rotating hash for daily unique estimates, honors DNT and GPC, filters bots, and never retains raw IP addresses." } },
  ] };
  return <><LandingExperience /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} /></>;
}
