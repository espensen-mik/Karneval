import SoulApp from "@/components/soul-app";
import "./soul.css";
import { parseSoulView } from "@/lib/soul-view";

export const metadata = { title: "SJÆLEN · Sjælen af Karneval" };

export default async function SoulPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const view = parseSoulView(await searchParams);
  return <SoulApp key={JSON.stringify(view)} initialView={view} />;
}
