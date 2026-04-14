import { NextRequest, NextResponse } from "next/server";
import { getLeads, createLead, updateLeadStatus } from "@/lib/services/actions";
import { setCorsHeaders, handleCors } from "@/lib/cors";

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

// GET leads (admin only, with pagination and filtering)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") as "NOT_CALLED" | "CALLED" | null;

    const result = await getLeads(page, limit, status || undefined);

    return setCorsHeaders(NextResponse.json(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return setCorsHeaders(
      NextResponse.json({ success: false, error: message }, { status: 500 })
    );
  }
}

// POST create lead (public, no auth required)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createLead(body);

    if (!result.success) {
      return setCorsHeaders(
        NextResponse.json(result, { status: 400 })
      );
    }

    return setCorsHeaders(
      NextResponse.json(result, { status: 201 })
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return setCorsHeaders(
      NextResponse.json({ success: false, error: message }, { status: 500 })
    );
  }
}

// PATCH update lead status (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await updateLeadStatus(body);

    if (!result.success) {
      return setCorsHeaders(
        NextResponse.json(result, { status: 400 })
      );
    }

    return setCorsHeaders(NextResponse.json(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return setCorsHeaders(
      NextResponse.json({ success: false, error: message }, { status: 500 })
    );
  }
}
