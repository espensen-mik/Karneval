import type { Metadata } from "next";
import "./globals.css";
import ResearchShell from "@/components/research-shell";

export const metadata: Metadata = {
  title: "Sjælen af Karneval",
  description: "Et internt researchrum for Aalborg Karneval",
  icons: { icon: [{ url: "/logo/Karmanaut_head_icon.svg", type: "image/svg+xml" }] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="da">
      <body>
        <ResearchShell>{children}</ResearchShell>
      </body>
    </html>
  );
}
