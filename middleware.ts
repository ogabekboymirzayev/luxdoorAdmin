import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequestWithAuth } from "next-auth/middleware";

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://10.115.115.60:3000',
  'https://musadoors.netlify.app',
  'https://musadoors.uz',
  'https://www.musadoors.uz',
]

function addCorsHeaders(req: NextRequestWithAuth, res: NextResponse) {
  const origin = req.headers.get('origin') ?? ''
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  res.headers.set('Access-Control-Allow-Origin', allowed)
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  res.headers.set('Access-Control-Allow-Credentials', 'true')
  return res
}

export const middleware = withAuth(
  function onSuccess(req: NextRequestWithAuth) {
    if (req.method === 'OPTIONS') {
      return addCorsHeaders(req, new NextResponse(null, { status: 200 }))
    }
    return addCorsHeaders(req, NextResponse.next())
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const pathname = req.nextUrl.pathname;
        const method = req.method;
        if (method === "OPTIONS") return true;
        if (pathname.startsWith("/api/leads") && method === "POST") return true;
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
    "/api/leads/:path*",
    "/api/products/:path*",
    "/api/categories/:path*",
    "/api/comments/:path*",
  ]
};