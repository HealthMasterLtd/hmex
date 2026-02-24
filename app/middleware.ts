import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_ROUTES = ["/dashboard", "/assessment", "/questions", "/review", "/risk-assesment"];

// Routes only for guests (redirect logged-in users away)
const GUEST_ROUTES = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Appwrite sets a session cookie — check for it
  // The cookie name follows the pattern: a_session_<projectId>
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
  const sessionCookie =
    request.cookies.get(`a_session_${projectId}`) ||
    request.cookies.get(`a_session_${projectId}_legacy`);

  const isLoggedIn = !!sessionCookie;

  // 1. Protect private routes
  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname); // remember where they came from
    return NextResponse.redirect(loginUrl);
  }

  // 2. Redirect logged-in users away from auth pages
  const isGuestRoute = GUEST_ROUTES.some((route) => pathname.startsWith(route));
  if (isGuestRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};