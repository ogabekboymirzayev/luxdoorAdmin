import { NextRequest, NextResponse } from "next/server";
import { setCorsHeaders, handleCors } from "@/lib/cors";
import { updateLeadStatus } from "@/lib/services/actions";

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const result = await updateLeadStatus({ id: params.id, ...body });

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
