import { NextRequest, NextResponse } from "next/server";
import { createProduct, updateProduct, deleteProduct, getProducts } from "@/lib/services/actions";
import { setCorsHeaders, handleCors } from "@/lib/cors";

// Handle preflight requests
export async function OPTIONS() {
  return new Response(null, { status: 204 });
}

// GET all products with pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const categoryId = searchParams.get("categoryId") || undefined;

    const result = await getProducts(page, limit, categoryId);

    return setCorsHeaders(NextResponse.json(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return setCorsHeaders(
      NextResponse.json({ success: false, error: message }, { status: 500 })
    );
  }
}

// POST create product (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createProduct(body);

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
