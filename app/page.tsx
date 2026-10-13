import HomeQuotes from "@/components/home-quotes";
import { readdir } from "node:fs/promises";
import path from "node:path";

export default async function Home() {
  const files = await readdir(path.join(process.cwd(), "public", "billeder"), { recursive: true });
  const images = files
    .filter((file) => /\.(jpe?g|png|webp|avif|gif)$/i.test(file))
    .sort()
    .map((file) => `/billeder/${file.split(path.sep).map(encodeURIComponent).join("/")}`);
  return (
    <div className="overview-page">
      <HomeQuotes images={images} />
    </div>
  );
}
