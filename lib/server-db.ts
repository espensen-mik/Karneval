import "server-only";
export function sourceConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key } : null;
}
export function sourceHeaders(key: string, prefer?: string) {
  return { apikey: key, ...(key.startsWith("sb_secret_") ? {} : { Authorization: `Bearer ${key}` }), "Content-Type": "application/json", ...(prefer ? { Prefer: prefer } : {}) };
}
export async function dbRequest(path: string, init: RequestInit = {}) {
  const config = sourceConfig();
  if (!config) throw new Error("Serverforbindelsen til Supabase mangler.");
  const response = await fetch(`${config.url}/rest/v1/${path}`, { ...init, headers: { ...sourceHeaders(config.key), ...init.headers }, cache: "no-store" });
  if (!response.ok) throw new Error(`Databasen svarede med HTTP ${response.status}.`);
  return response;
}
