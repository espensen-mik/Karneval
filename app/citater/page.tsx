import QuotesApp from "@/components/quotes-app";

import { overviewImages } from "@/lib/overview-images";

export default async function QuotesPage() {
  const images = await overviewImages();
  return <QuotesApp images={images} />;
}
