import "./survey-mobile.css";
import SurveyApp from "@/components/survey-app";
const title = "Sjælen af Aalborg Karneval";
const description = "Del dine oplevelser, tanker og minder om Aalborg Karneval — og deltag i lodtrækningen om 2 billetter.";
export const metadata = {
  metadataBase: new URL("https://karneval.karmanaut.dk"),
  title,
  description,
  alternates: { canonical: "/sjaelen" },
  openGraph: {
    title, description, type: "website", locale: "da_DK", url: "/sjaelen",
    siteName: "Sjælen af Aalborg Karneval",
    images: [{ url: "/sjaelen_og.jpg", width: 1200, height: 630, alt: "Sjælen af Aalborg Karneval" }],
  },
  twitter: { card: "summary_large_image", title, description, images: ["/sjaelen_og.jpg"] },
};
// Temporary layout preview: remove this flag when questionnaire design is approved.
const LAYOUT_TEST_ENABLED = true;
export default async function SurveyPage({ searchParams }: { searchParams: Promise<{ test?: string }> }) {
  const testMode = LAYOUT_TEST_ENABLED && (await searchParams).test === "1";
  return <SurveyApp testMode={testMode} />;
}
