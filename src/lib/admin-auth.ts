import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "./admin-session";

/**
 * Route-level admin guard (single shared password, HMAC-signed cookie).
 *
 * Usage in a route handler:
 *   if (!(await isAdminAuthenticated())) return adminUnauthorized();
 *
 * Usage in a server layout/page:
 *   if (!(await isAdminAuthenticated())) redirect("/admin/login");
 *
 * `cookies()` from next/headers works in both Route Handlers and Server
 * Components, so this one helper covers every admin entry point.
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

/** Standard 401 response for admin API routes. */
export function adminUnauthorized(): NextResponse {
  return NextResponse.json(
    { error: "Tidak terautentikasi. Silakan login sebagai admin." },
    { status: 401 },
  );
}
