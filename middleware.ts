import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, validSession } from "./lib/research-session";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isApi = path.startsWith("/api/");
  const origin = `${request.nextUrl.protocol}//${request.headers.get("host")}`;
  if (isApi && !["GET", "HEAD", "OPTIONS"].includes(request.method) && request.headers.get("origin") !== origin) {
    return NextResponse.json({ error: "Ugyldig forespørgsel." }, { status: 403 });
  }
  const publicPath = path.startsWith("/billeder/") || path.startsWith("/logo/") || path === "/login" || path === "/spoergeskema" || path === "/api/session" || (path === "/api/spoergeskema" && request.method === "POST");
  if (!publicPath && !await validSession(request.cookies.get(SESSION_COOKIE)?.value)) {
    if (isApi) return NextResponse.json({ error: "Log ind for at fortsætte." }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
    const login = new URL("/login", origin);
    login.searchParams.set("next", path + request.nextUrl.search);
    const response = NextResponse.redirect(login);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Referrer-Policy", "same-origin");
  return response;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
