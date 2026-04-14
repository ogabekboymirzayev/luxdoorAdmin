import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequestWithAuth } from "next-auth/middleware";

export const middleware = withAuth(
  function onSuccess(req: NextRequestWithAuth) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const pathname = req.nextUrl.pathname;
        const method = req.method;

        // OPTIONS (preflight) — har doim o'tkazib yuborish
        if (method === "OPTIONS") return true;

        // /api/leads POST — public
        if (pathname.startsWith("/api/leads") && method === "POST") return true;

        // Admin routes — himoyalangan
        if (
          pathname.startsWith("/admin") ||
          pathname.startsWith("/api/admin") ||
          pathname.startsWith("/api/leads")
        ) {
          return !!token;
        }

        return true;
      }
    },
    pages: {
      signIn: "/admin/login"
    }
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/leads/:path*"
  ]
};