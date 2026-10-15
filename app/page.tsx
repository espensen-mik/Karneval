import HomeQuotes from "@/components/home-quotes";
import { overviewImages } from "@/lib/overview-images";

export default async function Home() {
  const images = await overviewImages();
  return (
    <div className="overview-page">
      <HomeQuotes images={images} />
    </div>
  );
}
