import { Suspense } from "react";
import { randomInt } from "node:crypto";
import LoginForm from "@/components/login-form";
import { overviewImages } from "@/lib/overview-images";
export const dynamic = "force-dynamic";
export const metadata = { title: "Log ind · Sjælen af Karneval", robots: { index: false, follow: false } };
export default async function LoginPage() {
  const images = await overviewImages();
  const background = images.length ? images[randomInt(images.length)] : null;
  return <Suspense fallback={null}><LoginForm background={background} /></Suspense>;
}
