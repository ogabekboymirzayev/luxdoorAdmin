import { NextRequest, NextResponse } from "next/server";
import { setCorsHeaders } from "@/lib/cors";
import { createCategory, deleteCategory, getCategories, restoreCategory } from "@/lib/services/actions";

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}

export async function GET(request: NextRequest) {
  try {
    const includeDeleted = request.nextUrl.searchParams.get("includeDeleted") === "1";
    const result = await getCategories(includeDeleted);
    return setCorsHeaders(NextResponse.json(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return setCorsHeaders(NextResponse.json({ success: false, error: message }, { status: 500 }));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createCategory(body);
    if (!result.success) {
      return setCorsHeaders(NextResponse.json(result, { status: 400 }));
    }

    return setCorsHeaders(NextResponse.json(result, { status: 201 }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return setCorsHeaders(NextResponse.json({ success: false, error: message }, { status: 500 }));
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return setCorsHeaders(NextResponse.json({ success: false, error: "id majburiy" }, { status: 400 }));
    }

    const result = await deleteCategory(id);
    if (!result.success) {
      return setCorsHeaders(NextResponse.json(result, { status: 400 }));
    }

    return setCorsHeaders(NextResponse.json(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return setCorsHeaders(NextResponse.json({ success: false, error: message }, { status: 500 }));
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, action } = await request.json();

    if (!id || action !== "restore") {
      return setCorsHeaders(NextResponse.json({ success: false, error: "id va restore action majburiy" }, { status: 400 }));
    }

    const result = await restoreCategory(id);
    if (!result.success) {
      return setCorsHeaders(NextResponse.json(result, { status: 400 }));
    }

    return setCorsHeaders(NextResponse.json(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return setCorsHeaders(NextResponse.json({ success: false, error: message }, { status: 500 }));
  }
}