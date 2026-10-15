import SoulApp from "@/components/soul-app";
import { parseSoulView } from "@/lib/soul-view";
import "../soul.css";

export const metadata = { title: "Kuratering & visning · SJÆLEN" };

export default async function SoulManagementPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const view = parseSoulView(await searchParams);
  return <SoulApp key={JSON.stringify(view)} manage initialView={view} />;
}
