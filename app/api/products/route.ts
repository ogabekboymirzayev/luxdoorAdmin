import { NextRequest, NextResponse } from "next/server";
import { createProduct, getProducts } from "@/lib/services/actions";
import { setCorsHeaders } from "@/lib/cors";

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
    const categoryIds = (searchParams.get("categoryIds") || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    const search = searchParams.get("search") || undefined;
    const sort = (searchParams.get("sort") as "default" | "price-asc" | "price-desc" | null) || "default";
    const includeDeleted = searchParams.get("includeDeleted") === "1";
    const minPriceRaw = searchParams.get("minPrice");
    const maxPriceRaw = searchParams.get("maxPrice");
    const minPrice = minPriceRaw !== null && minPriceRaw !== "" ? Number(minPriceRaw) : undefined;
    const maxPrice = maxPriceRaw !== null && maxPriceRaw !== "" ? Number(maxPriceRaw) : undefined;

    const result = await getProducts(page, limit, {
      categoryId,
      categoryIds,
      search,
      minPrice: minPrice !== undefined && !Number.isNaN(minPrice) ? minPrice : undefined,
      maxPrice: maxPrice !== undefined && !Number.isNaN(maxPrice) ? maxPrice : undefined,
      sort,
      includeDeleted,
    });

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
