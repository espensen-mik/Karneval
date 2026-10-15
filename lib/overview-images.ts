import "server-only";
import { readdir } from "node:fs/promises";
import path from "node:path";

export async function overviewImages() {
  const files = await readdir(path.join(process.cwd(), "public", "billeder"), { recursive: true });
  return files.filter(file => /\.(jpe?g|png|webp|avif|gif)$/i.test(file)).sort()
    .map(file => `/billeder/${file.split(path.sep).map(encodeURIComponent).join("/")}`);
}
