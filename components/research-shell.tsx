"use client";
import { usePathname } from "next/navigation";
import Sidebar from "./sidebar";
export default function ResearchShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (path === "/login" || path === "/spoergeskema") return <main className="public-experience">{children}</main>;
  return <div className="app-frame"><Sidebar /><main className="main-area">{children}</main></div>;
}
