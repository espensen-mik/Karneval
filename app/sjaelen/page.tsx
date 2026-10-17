import "./survey-mobile.css";
import SurveyApp from "@/components/survey-app";
export const metadata = { title: "Del dit karneval · Den digitale sjæl", description: "Del dine ord, minder og oplevelser fra Aalborg Karneval." };
// Temporary layout preview: remove this flag when questionnaire design is approved.
const LAYOUT_TEST_ENABLED = true;
export default async function SurveyPage({ searchParams }: { searchParams: Promise<{ test?: string }> }) {
  const testMode = LAYOUT_TEST_ENABLED && (await searchParams).test === "1";
  return <SurveyApp testMode={testMode} />;
}
