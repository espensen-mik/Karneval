import { notFound } from "next/navigation";
import WorkshopApp from "@/components/workshop-app";
import { WORKSHOP_PAGES, type WorkshopSection } from "@/lib/workshop";
export function generateStaticParams(){return WORKSHOP_PAGES.map(page=>({section:page.slug}));}
export async function generateMetadata({params}:{params:Promise<{section:string}>}){const {section}=await params;const page=WORKSHOP_PAGES.find(page=>page.slug===section);return {title:`${page?.label||"Sjælemøde"} · Sjælemøde`};}
export default async function WorkshopPage({params}:{params:Promise<{section:string}>}){const {section}=await params;if(!WORKSHOP_PAGES.some(page=>page.slug===section))notFound();return <WorkshopApp section={section as WorkshopSection}/>;}
