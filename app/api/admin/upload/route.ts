import { NextRequest, NextResponse } from "next/server";
import { uploadToStorage } from "@/lib/services/storage";
import { requireRole } from "@/lib/auth/auth";
import { ImageUploadSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN");

    const body = await request.json();
    const validated = ImageUploadSchema.parse(body);

    const result = await uploadToStorage(
      validated.base64,
      validated.folder || "products"
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          url: result.url,
          publicId: result.publicId
        }
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}