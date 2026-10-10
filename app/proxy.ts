import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const session = await auth.api.getSession({ headers: request.headers });
  const publicPaths = ["/", "/login", "/login/register", "/login/forgot-password"];

  if (pathname === "/login/complete-profile") {
    return session
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/login/register", request.url));
  }

  if (publicPaths.includes(pathname)) {
    return session
      ? NextResponse.redirect(new URL("/home", request.url))
      : NextResponse.next();
  }

  return session
    ? NextResponse.next()
    : NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};