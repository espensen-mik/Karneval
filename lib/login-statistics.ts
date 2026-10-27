import { createHmac } from "node:crypto";
import { isIP } from "node:net";

// Only trust the IP header set by Vercel on the deployed application.
export function loginFingerprint(headers: Headers, secret: string, vercel = process.env.VERCEL === "1") {
  const raw = headers.get(vercel ? "x-vercel-forwarded-for" : "x-real-ip")?.split(",")[0].trim();
  if (!raw || !isIP(raw)) return null;
  const canonical = isIP(raw) === 6 ? new URL(`http://[${raw}]/`).hostname : raw;
  return createHmac("sha256", secret).update(`research-login-statistics:v1:${canonical}`).digest("hex");
}
