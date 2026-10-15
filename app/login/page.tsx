import { Suspense } from "react";
import LoginForm from "@/components/login-form";
export const metadata = { title: "Log ind · Sjælen af Karneval", robots: { index: false, follow: false } };
export default function LoginPage() { return <Suspense fallback={<p>Åbner …</p>}><LoginForm /></Suspense>; }
