import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://10.115.115.60:3000",
  "http://10.115.115.60:3001",
  "https://musadoors.netlify.app",
  "https://musadoors.uz",
  "https://www.musadoors.uz",
];

export function setCorsHeaders(response: NextResponse, request?: NextRequest) {
  // CORS is handled centrally in middleware to avoid duplicate ACAO headers.
  // Keep this helper as a pass-through for existing route usage.
  void request;
  return response;
}

export async function handleCors(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return setCorsHeaders(new NextResponse(null, { status: 200 }), request);
  }
  return null;
}
