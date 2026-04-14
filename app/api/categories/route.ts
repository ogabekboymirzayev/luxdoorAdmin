import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setCorsHeaders, handleCors } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { products: true } } }
    });
    return setCorsHeaders(NextResponse.json({ success: true, data: categories }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return setCorsHeaders(NextResponse.json({ success: false, error: message }, { status: 500 }));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nameUz, nameRu } = body;
    if (!nameUz || !nameRu) {
      return setCorsHeaders(NextResponse.json({ success: false, error: "nameUz va nameRu majburiy" }, { status: 400 }));
    }
    const category = await prisma.category.create({ data: { nameUz, nameRu } });
    return setCorsHeaders(NextResponse.json({ success: true, data: category }, { status: 201 }));
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
    await prisma.category.delete({ where: { id } });
    return setCorsHeaders(NextResponse.json({ success: true }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return setCorsHeaders(NextResponse.json({ success: false, error: message }, { status: 500 }));
  }
}