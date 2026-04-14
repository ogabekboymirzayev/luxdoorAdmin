import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

export interface UploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

// uploads papkasi yo'q bo'lsa yaratish
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export async function uploadToStorage(
  base64Data: string,
  folder: string = "products"
): Promise<UploadResult> {
  try {
    // base64 dan fayl turini aniqlash
    const matches = base64Data.match(/^data:image\/(\w+);base64,/);
    if (!matches) {
      return { success: false, error: "Noto'g'ri rasm formati" };
    }

    const ext = matches[1]; // jpeg, png, webp
    const base64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64, "base64");

    // Papka yaratish
    const folderPath = path.join(UPLOADS_DIR, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // Fayl nomi
    const fileName = `${randomUUID()}.${ext}`;
    const filePath = path.join(folderPath, fileName);

    // Faylni saqlash
    fs.writeFileSync(filePath, buffer);

    const url = `/uploads/${folder}/${fileName}`;

    return {
      success: true,
      url,
      publicId: `${folder}/${fileName}`
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[STORAGE] Upload failed:", errorMessage);
    return { success: false, error: `Upload failed: ${errorMessage}` };
  }
}

export async function deleteFromStorage(
  publicId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const filePath = path.join(UPLOADS_DIR, publicId);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[STORAGE] Delete failed:", errorMessage);
    return { success: false, error: `Delete failed: ${errorMessage}` };
  }
}