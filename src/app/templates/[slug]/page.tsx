import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PRINT_TEMPLATES, getTemplate } from "@/config/templates";
import { TemplateStudio } from "@/components/templates/TemplateStudio";
export function generateStaticParams() { return PRINT_TEMPLATES.map((template) => ({ slug: template.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const template = getTemplate((await params).slug); return { title: template ? `${template.name} QR print template` : "Template", description: template?.description }; }
export default async function TemplatePage({ params }: { params: Promise<{ slug: string }> }) { const template = getTemplate((await params).slug); if (!template) notFound(); const breadcrumb = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "QRForge", item: "/" }, { "@type": "ListItem", position: 2, name: "Print templates", item: "/templates" }, { "@type": "ListItem", position: 3, name: template.name, item: `/templates/${template.slug}` }] }; return <><TemplateStudio template={template} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} /></>; }
