import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const path = request.nextUrl.pathname;

  // Static assets - long cache
  if (
    path.startsWith("/images/") ||
    /\.(woff|woff2|svg|png|jpg|jpeg|gif|webp|ico)$/.test(path)
  ) {
    response.headers.set("Cache-Control", "public, max-age=31536000, immutable");
  }
  // HTML pages - no cache
  else {
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};