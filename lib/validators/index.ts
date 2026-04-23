import { z } from "zod";

/**
 * Login validator
 */
export const LoginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters")
});
export type LoginInput = z.infer<typeof LoginSchema>;

/**
 * Create/Update Product validator
 */
export const ProductSchema = z.object({
  slug: z.string().min(3, "Slug is required").max(255).optional(),
  nameUz: z.string().min(1, "Name (Uz) is required").max(255),
  nameRu: z.string().min(1, "Name (Ru) is required").max(255),
  descriptionUz: z.string().min(1, "Description (Uz) is required"),
  descriptionRu: z.string().min(1, "Description (Ru) is required"),
  price: z.string()
    .or(z.number())
    .refine((val) => {
      const num = typeof val === "string" ? parseFloat(val) : val;
      return num > 0 && num <= 999999999.99;
    }, "Price must be a valid positive number"),
  oldPrice: z.string()
    .or(z.number())
    .optional()
    .nullable()
    .refine((val) => {
      if (val === undefined || val === null || val === "") return true;
      const num = typeof val === "string" ? parseFloat(val) : val;
      return num > 0 && num <= 999999999.99;
    }, "Old price must be a valid positive number"),
  badgeType: z.enum(["NONE", "SALE", "NEW", "HIT"]).optional().default("NONE"),
  badgeTextUz: z.string().max(100).optional().nullable(),
  badgeTextRu: z.string().max(100).optional().nullable(),
  categoryId: z.string().min(1, "Category is required"),
  images: z.array(z.string()).max(4, "Har bir mahsulot uchun maksimal 4 ta rasm ruxsat etiladi").optional().default([]),
  attributes: z.record(z.string(), z.string()).optional().default({})
}).refine((data) => {
  if (data.oldPrice === undefined || data.oldPrice === null || data.oldPrice === "") return true;
  const price = typeof data.price === "string" ? parseFloat(data.price) : data.price;
  const oldPrice = typeof data.oldPrice === "string" ? parseFloat(data.oldPrice) : data.oldPrice;
  return oldPrice >= price;
}, {
  message: "Old price must be greater than or equal to current price",
  path: ["oldPrice"],
});
export type ProductInput = z.infer<typeof ProductSchema>;

/**
 * Create/Update Comment validator
 */
export const CommentSchema = z.object({
  productId: z.string().min(1, "Invalid product ID"),
  authorName: z.string().min(2, "Name must be at least 2 characters").max(80),
  text: z.string().min(3, "Comment must be at least 3 characters").max(1000),
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5")
});
export type CommentInput = z.infer<typeof CommentSchema>;

/**
 * Create Lead validator
 */
export const LeadSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  phone: z.string().min(1, "Phone is required").max(20),
  message: z.string().min(1, "Message is required").max(1000),
  source: z.enum(["website", "telegram", "phone", "other"]).optional()
});
export type LeadInput = z.infer<typeof LeadSchema>;

/**
 * Update Lead Status validator
 */
export const UpdateLeadStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["NEW", "CONTACTED", "NEGOTIATION", "WON", "LOST", "NOT_CALLED", "CALLED"]),
  notes: z.string().max(3000).optional(),
  nextFollowUpAt: z.string().datetime().optional().nullable()
});
export type UpdateLeadStatusInput = z.infer<typeof UpdateLeadStatusSchema>;

/**
 * Create/Update Category validator
 */
export const CategorySchema = z.object({
  nameUz: z.string().min(2).max(100),
  nameRu: z.string().min(2).max(100)
});
export type CategoryInput = z.infer<typeof CategorySchema>;

/**
 * Create Admin User validator
 */
export const CreateAdminSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character")
});
export type CreateAdminInput = z.infer<typeof CreateAdminSchema>;

/**
 * Image upload validator
 */
export const ImageUploadSchema = z.object({
  base64: z.string()
    .startsWith("data:image/", "Must be a valid image base64 string"),
  folder: z.string().optional()
});
export type ImageUploadInput = z.infer<typeof ImageUploadSchema>;