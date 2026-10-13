import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/sidebar";

export const metadata: Metadata = {
  title: "Sjælen af Karneval",
  description: "Et internt researchrum for Aalborg Karneval",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="da">
      <body>
        <div className="app-frame">
          <Sidebar />
          <main className="main-area">{children}</main>
        </div>
      </body>
    </html>
  );
}