import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
];

export function setCorsHeaders(response: NextResponse) {
  const origin = "http://localhost:3000"; // Default to frontend

  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Max-Age", "3600");

  return response;
}

export async function handleCors(request: NextRequest) {
  // Handle preflight requests
  if (request.method === "OPTIONS") {
    return setCorsHeaders(new NextResponse(null, { status: 200 }));
  }

  return null;
}
