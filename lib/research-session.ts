export const SESSION_COOKIE = "karneval_research";
export const SESSION_SECONDS = 60 * 60 * 12;
export const MIN_PASSWORD_LENGTH = 12;
const encoder = new TextEncoder();

export function loginConfigured() { return (process.env.RESEARCH_PASSWORD?.length ?? 0) >= MIN_PASSWORD_LENGTH; }
async function key() {
  if (!loginConfigured()) throw new Error("Login er ikke konfigureret.");
  const serverSecret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serverSecret) throw new Error("Servernøglen er ikke konfigureret.");
  const material = encoder.encode(`karneval-session:v1\0${serverSecret}\0${process.env.RESEARCH_PASSWORD}`);
  return crypto.subtle.importKey("raw", material, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
function encode(value: Uint8Array) { return btoa(String.fromCharCode(...value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
function decode(value: string) { return Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0)); }
export async function createSession(now = Date.now()) {
  const payload = encode(encoder.encode(JSON.stringify({ exp: Math.floor(now / 1000) + SESSION_SECONDS, nonce: crypto.randomUUID() })));
  const signature = await crypto.subtle.sign("HMAC", await key(), encoder.encode(`research.v1.${payload}`));
  return `${payload}.${encode(new Uint8Array(signature))}`;
}
export async function validSession(token: string | undefined, now = Date.now()) {
  if (!token || token.length > 512 || !loginConfigured()) return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 2 || !await crypto.subtle.verify("HMAC", await key(), decode(parts[1]), encoder.encode(`research.v1.${parts[0]}`))) return false;
    const { exp, nonce } = JSON.parse(new TextDecoder().decode(decode(parts[0])));
    const current = Math.floor(now / 1000);
    return Number.isInteger(exp) && exp > current && exp <= current + SESSION_SECONDS && typeof nonce === "string";
  } catch { return false; }
}
export function safeReturnPath(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") && !/[\\\u0000-\u0020]/.test(value) && !value.startsWith("/login") && !value.startsWith("/api/") ? value : "/";
}
