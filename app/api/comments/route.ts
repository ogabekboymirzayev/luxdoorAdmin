import { NextRequest, NextResponse } from "next/server";
import { createComment, getComments, deleteComment } from "@/lib/services/actions";
import { setCorsHeaders, handleCors } from "@/lib/cors";

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

// GET comments for a product
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get("productId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!productId) {
      return setCorsHeaders(
        NextResponse.json(
          { success: false, error: "productId is required" },
          { status: 400 }
        )
      );
    }

    const result = await getComments(productId, page, limit);

    return setCorsHeaders(NextResponse.json(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return setCorsHeaders(
      NextResponse.json({ success: false, error: message }, { status: 500 })
    );
  }
}

// POST create comment (public, no auth required)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createComment(body);

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

// DELETE comment (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return setCorsHeaders(
        NextResponse.json(
          { success: false, error: "Comment ID is required" },
          { status: 400 }
        )
      );
    }

    const result = await deleteComment(id);

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
