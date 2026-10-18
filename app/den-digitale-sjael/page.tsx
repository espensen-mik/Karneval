import DigitalSoulApp from "@/components/digital-soul-app";
export const metadata = { title: "Den digitale sjæl · Sjælen af Karneval", robots: { index: false, follow: false } };
export default async function DigitalSoulPage({ searchParams }: { searchParams: Promise<{ response?: string }> }) {
  const response = (await searchParams).response || "";
  const responseId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(response) ? response : "";
  return <DigitalSoulApp initialResponseId={responseId} />;
}
