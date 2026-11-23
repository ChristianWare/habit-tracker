// Everything but the login page needs you signed in.
import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const signedIn = Boolean(req.auth?.user);

  if (pathname.startsWith("/api/auth")) return NextResponse.next();

  if (pathname === "/login") {
    return signedIn
      ? NextResponse.redirect(new URL("/", req.nextUrl))
      : NextResponse.next();
  }

  if (!signedIn) {
    const url = new URL("/login", req.nextUrl);
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  // Skip Next's own files, the fonts and the icons.
  matcher: [
    "/((?!_next/static|_next/image|fonts/|favicon.ico|icon.svg|apple-icon.png|manifest.webmanifest|robots.txt|icon-192.png|icon-512.png).*)",
  ],
};
