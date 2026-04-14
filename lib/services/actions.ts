"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole, getCurrentSession } from "@/lib/auth/auth";
import {
  ProductSchema,
  CommentSchema,
  LeadSchema,
  UpdateLeadStatusSchema,
  CreateAdminSchema,
  CategorySchema
} from "@/lib/validators";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import type { Prisma } from "@prisma/client";

// ============ RESPONSE TYPES ============

interface ServerActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============ PRODUCT ACTIONS ============

export async function createProduct(
  input: unknown
): Promise<ServerActionResponse<any>> {
  try {
    await requireRole("ADMIN");

    const validated = ProductSchema.parse(input);

    // Use provided slug or generate from nameRu
    const slug = validated.slug || validated.nameRu.replace(/\s+/g, '-');

    const product = await prisma.product.create({
      data: {
        slug,
        nameUz: validated.nameUz,
        nameRu: validated.nameRu,
        descriptionUz: validated.descriptionUz,
        descriptionRu: validated.descriptionRu,
        price: parseFloat(validated.price.toString()),
        categoryId: validated.categoryId,
        images: validated.images || [],
        attributes: validated.attributes || {}
      },
      include: {
        category: true
      }
    });

    console.log(`[PRODUCTS] Product created: ${product.id}`);

    return {
      success: true,
      data: product
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create product";
    console.error("[PRODUCTS] Create error:", message);

    return {
      success: false,
      error: message
    };
  }
}

export async function updateProduct(
  id: string,
  input: unknown
): Promise<ServerActionResponse<any>> {
  try {
    await requireRole("ADMIN");

    const validated = ProductSchema.parse(input);

    // Use provided slug or generate from nameRu
    const slug = validated.slug || validated.nameRu.replace(/\s+/g, '-');

    // Try to find by ID first, then by slug
    let whereClause: any = { id };
    let existingProduct = await prisma.product.findUnique({ where: { id } });
    
    if (!existingProduct) {
      whereClause = { slug: id };
    }

    const product = await prisma.product.update({
      where: whereClause,
      data: {
        slug,
        nameUz: validated.nameUz,
        nameRu: validated.nameRu,
        descriptionUz: validated.descriptionUz,
        descriptionRu: validated.descriptionRu,
        price: validated.price.toString(),
        categoryId: validated.categoryId,
        images: validated.images || [],
        attributes: validated.attributes || {}
      },
      include: {
        category: true
      }
    });

    console.log(`[PRODUCTS] Product updated: ${id}`);

    return {
      success: true,
      data: product
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update product";
    console.error("[PRODUCTS] Update error:", message);

    return {
      success: false,
      error: message
    };
  }
}

export async function deleteProduct(
  id: string
): Promise<ServerActionResponse<void>> {
  try {
    await requireRole("ADMIN");

    // Try to find by ID first, then by slug
    let whereClause: any = { id };
    const existingProduct = await prisma.product.findUnique({ where: { id } });
    
    if (!existingProduct) {
      whereClause = { slug: id };
    }

    await prisma.product.delete({
      where: whereClause
    });

    console.log(`[PRODUCTS] Product deleted: ${id}`);

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete product";
    console.error("[PRODUCTS] Delete error:", message);

    return {
      success: false,
      error: message
    };
  }
}

export async function getProduct(
  id: string
): Promise<ServerActionResponse<any>> {
  try {
    // Try to find by ID first, then by slug
    let product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        comments: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    // If not found by ID, try to find by slug
    if (!product) {
      product = await prisma.product.findUnique({
        where: { slug: id },
        include: {
          category: true,
          comments: {
            orderBy: { createdAt: "desc" }
          }
        }
      });
    }

    if (!product) {
      return {
        success: false,
        error: "Product not found"
      };
    }

    return {
      success: true,
      data: product
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch product";
    console.error("[PRODUCTS] Fetch single error:", message);

    return {
      success: false,
      error: message
    };
  }
}

export async function getProducts(
  page: number = 1,
  limit: number = 10,
  categoryId?: string
): Promise<ServerActionResponse<any>> {
  try {
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = categoryId
      ? { categoryId }
      : {};

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          comments: {
            take: 5,
            orderBy: { createdAt: "desc" }
          }
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.product.count({ where })
    ]);

    return {
      success: true,
      data: {
        products,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch products";
    console.error("[PRODUCTS] Fetch error:", message);

    return {
      success: false,
      error: message
    };
  }
}

// ============ COMMENT ACTIONS ============

export async function createComment(
  input: unknown
): Promise<ServerActionResponse<any>> {
  try {
    const validated = CommentSchema.parse(input);

    const comment = await prisma.comment.create({
      data: {
        productId: validated.productId,
        text: validated.text,
        rating: validated.rating
      },
      include: {
        product: true
      }
    });

    console.log(`[COMMENTS] Comment created: ${comment.id}`);

    return {
      success: true,
      data: comment
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create comment";
    console.error("[COMMENTS] Create error:", message);

    return {
      success: false,
      error: message
    };
  }
}

export async function deleteComment(
  id: string
): Promise<ServerActionResponse<void>> {
  try {
    await requireRole("ADMIN");

    await prisma.comment.delete({
      where: { id }
    });

    console.log(`[COMMENTS] Comment deleted: ${id}`);

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete comment";
    console.error("[COMMENTS] Delete error:", message);

    return {
      success: false,
      error: message
    };
  }
}

export async function getComments(
  productId: string,
  page: number = 1,
  limit: number = 10
): Promise<ServerActionResponse<any>> {
  try {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { productId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }
      }),
      prisma.comment.count({ where: { productId } })
    ]);

    return {
      success: true,
      data: {
        comments,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch comments";
    console.error("[COMMENTS] Fetch error:", message);

    return {
      success: false,
      error: message
    };
  }
}

// ============ LEAD ACTIONS ============

export async function createLead(
  input: unknown
): Promise<ServerActionResponse<any>> {
  try {
    const validated = LeadSchema.parse(input);

    const lead = await prisma.lead.create({
      data: {
        name: validated.name,
        phone: validated.phone,
        message: validated.message,
        status: "NOT_CALLED"
      }
    });

    console.log(`[LEADS] Lead created: ${lead.id}`);

    return {
      success: true,
      data: lead
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create lead";
    console.error("[LEADS] Create error:", message);

    return {
      success: false,
      error: message
    };
  }
}

export async function updateLeadStatus(
  input: unknown
): Promise<ServerActionResponse<any>> {
  try {
    await requireRole("ADMIN");

    const validated = UpdateLeadStatusSchema.parse(input);

    const lead = await prisma.lead.update({
      where: { id: validated.id },
      data: { status: validated.status }
    });

    console.log(`[LEADS] Lead status updated: ${validated.id} -> ${validated.status}`);

    return {
      success: true,
      data: lead
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update lead";
    console.error("[LEADS] Update error:", message);

    return {
      success: false,
      error: message
    };
  }
}

export async function getLeads(
  page: number = 1,
  limit: number = 10,
  status?: "NOT_CALLED" | "CALLED"
): Promise<ServerActionResponse<any>> {
  try {
    await requireRole("ADMIN");

    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }
      }),
      prisma.lead.count({ where })
    ]);

    return {
      success: true,
      data: {
        leads,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch leads";
    console.error("[LEADS] Fetch error:", message);

    return {
      success: false,
      error: message
    };
  }
}

// ============ ADMIN ACTIONS ============

export async function createAdmin(
  input: unknown
): Promise<ServerActionResponse<any>> {
  try {
    await requireRole("SUPERADMIN");

    const validated = CreateAdminSchema.parse(input);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: validated.username }
    });

    if (existingUser) {
      return {
        success: false,
        error: "Username already exists"
      };
    }

    const hashedPassword = await hashPassword(validated.password);

    const user = await prisma.user.create({
      data: {
        username: validated.username,
        password: hashedPassword,
        role: "ADMIN"
      }
    });

    console.log(`[ADMIN] New admin created: ${user.username}`);

    return {
      success: true,
      data: {
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt
      }
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create admin";
    console.error("[ADMIN] Create error:", message);

    return {
      success: false,
      error: message
    };
  }
}

export async function deleteAdmin(
  id: string
): Promise<ServerActionResponse<void>> {
  try {
    await requireRole("SUPERADMIN");

    // Prevent deleting the last superadmin
    const user = await prisma.user.findUnique({ where: { id } });

    if (user?.role === "SUPERADMIN") {
      const superadminCount = await prisma.user.count({
        where: { role: "SUPERADMIN" }
      });

      if (superadminCount <= 1) {
        return {
          success: false,
          error: "Cannot delete the last SUPERADMIN"
        };
      }
    }

    await prisma.user.delete({
      where: { id }
    });

    console.log(`[ADMIN] Admin deleted: ${id}`);

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete admin";
    console.error("[ADMIN] Delete error:", message);

    return {
      success: false,
      error: message
    };
  }
}

export async function getAdmins(): Promise<ServerActionResponse<any>> {
  try {
    await requireRole("SUPERADMIN");

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: "desc" }
    });

    return {
      success: true,
      data: users
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch admins";
    console.error("[ADMIN] Fetch error:", message);

    return {
      success: false,
      error: message
    };
  }
}

// ============ CATEGORY ACTIONS ============

export async function createCategory(
  input: unknown
): Promise<ServerActionResponse<any>> {
  try {
    await requireRole("ADMIN");

    const validated = CategorySchema.parse(input);

    const category = await prisma.category.create({
      data: {
        nameUz: validated.nameUz,
        nameRu: validated.nameRu
      }
    });

    console.log(`[CATEGORIES] Category created: ${category.id}`);

    return {
      success: true,
      data: category
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create category";
    console.error("[CATEGORIES] Create error:", message);

    return {
      success: false,
      error: message
    };
  }
}

export async function getCategories(): Promise<ServerActionResponse<any>> {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: "asc" }
    });

    return {
      success: true,
      data: categories
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch categories";
    console.error("[CATEGORIES] Fetch error:", message);

    return {
      success: false,
      error: message
    };
  }
}
