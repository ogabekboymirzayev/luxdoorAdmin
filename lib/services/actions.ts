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
import { notifyNewLead } from "@/lib/services/notifications";
import type { Prisma } from "@prisma/client";
import { createHash } from "crypto";

// ============ RESPONSE TYPES ============

interface ServerActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");

  // Accept +998XXXXXXXXX, 998XXXXXXXXX, or local 9-digit numbers.
  if (digits.length === 12 && digits.startsWith("998")) {
    return `+${digits}`;
  }

  if (digits.length === 9) {
    return `+998${digits}`;
  }

  return null;
}

function hashIp(ip: string): string {
  const salt = process.env.LEAD_RATE_LIMIT_SALT || "luxdoor-default-salt";
  return createHash("sha256").update(`${ip}:${salt}`).digest("hex");
}

async function getAuditActor() {
  const session = await getCurrentSession();
  return {
    actorId: (session?.user as any)?.id as string | undefined,
    actorUsername: (session?.user as any)?.username as string | undefined,
  };
}

async function createAuditLog(
  entityType: string,
  entityId: string,
  action: string,
  metadata?: Record<string, unknown>
) {
  try {
    const actor = await getAuditActor();
    await prisma.auditLog.create({
      data: {
        entityType,
        entityId,
        action,
        actorId: actor.actorId,
        actorUsername: actor.actorUsername,
        // metadata: metadata || undefined,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      },
    });

    const staleLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: 50,
      select: { id: true },
    });

    if (staleLogs.length > 0) {
      await prisma.auditLog.deleteMany({
        where: {
          id: {
            in: staleLogs.map((log) => log.id),
          },
        },
      });
    }
  } catch (error) {
    // Audit logging must never break business flow.
    console.error("[AUDIT] Failed to write log:", error);
  }
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
        oldPrice: validated.oldPrice ? parseFloat(validated.oldPrice.toString()) : null,
        badgeType: validated.badgeType || "NONE",
        badgeTextUz: validated.badgeTextUz || null,
        badgeTextRu: validated.badgeTextRu || null,
        categoryId: validated.categoryId,
        images: validated.images || [],
        attributes: validated.attributes || {}
      },
      include: {
        category: true
      }
    });

    console.log(`[PRODUCTS] Product created: ${product.id}`);
    await createAuditLog("PRODUCT", product.id, "CREATE", {
      nameUz: product.nameUz,
      categoryId: product.categoryId,
    });

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
    const existingProduct = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      select: { id: true, deletedAt: true },
    });

    if (!existingProduct) {
      return {
        success: false,
        error: "Product not found",
      };
    }

    if (existingProduct.deletedAt) {
      return {
        success: false,
        error: "Cannot update archived product. Restore it first.",
      };
    }

    const product = await prisma.product.update({
      where: { id: existingProduct.id },
      data: {
        slug,
        nameUz: validated.nameUz,
        nameRu: validated.nameRu,
        descriptionUz: validated.descriptionUz,
        descriptionRu: validated.descriptionRu,
        price: validated.price.toString(),
        oldPrice: validated.oldPrice ? validated.oldPrice.toString() : null,
        badgeType: validated.badgeType || "NONE",
        badgeTextUz: validated.badgeTextUz || null,
        badgeTextRu: validated.badgeTextRu || null,
        categoryId: validated.categoryId,
        images: validated.images || [],
        attributes: validated.attributes || {}
      },
      include: {
        category: true
      }
    });

    console.log(`[PRODUCTS] Product updated: ${id}`);
    await createAuditLog("PRODUCT", product.id, "UPDATE", {
      nameUz: product.nameUz,
      categoryId: product.categoryId,
    });

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

    const existingProduct = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      select: { id: true, deletedAt: true },
    });

    if (!existingProduct) {
      return {
        success: false,
        error: "Product not found",
      };
    }

    if (existingProduct.deletedAt) {
      return {
        success: true,
      };
    }

    const actor = await getAuditActor();
    await prisma.product.update({
      where: { id: existingProduct.id },
      data: {
        deletedAt: new Date(),
        deletedBy: actor.actorUsername || actor.actorId || "system",
      }
    });

    console.log(`[PRODUCTS] Product deleted: ${id}`);
    await createAuditLog("PRODUCT", existingProduct.id, "SOFT_DELETE");

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

export async function restoreProduct(
  id: string
): Promise<ServerActionResponse<void>> {
  try {
    await requireRole("ADMIN");

    const existingProduct = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      select: { id: true, deletedAt: true },
    });

    if (!existingProduct) {
      return {
        success: false,
        error: "Product not found",
      };
    }

    if (!existingProduct.deletedAt) {
      return { success: true };
    }

    await prisma.product.update({
      where: { id: existingProduct.id },
      data: {
        deletedAt: null,
        deletedBy: null,
      },
    });

    await createAuditLog("PRODUCT", existingProduct.id, "RESTORE");

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to restore product";
    console.error("[PRODUCTS] Restore error:", message);

    return {
      success: false,
      error: message,
    };
  }
}

export async function getProduct(
  id: string
): Promise<ServerActionResponse<any>> {
  try {
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        deletedAt: null,
        category: {
          deletedAt: null,
        },
      },
      include: {
        category: true,
        comments: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!product) {
      return {
        success: false,
        error: "Product not found"
      };
    }

    const relatedProducts = await prisma.product.findMany({
      where: {
        id: { not: product.id },
        categoryId: product.categoryId,
        deletedAt: null,
      },
      include: {
        category: true,
        comments: {
          take: 3,
          orderBy: { createdAt: "desc" }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    });

    const ratingCount = product.comments.length;
    const ratingAverage = ratingCount > 0
      ? product.comments.reduce((sum, c) => sum + c.rating, 0) / ratingCount
      : 0;

    return {
      success: true,
      data: {
        ...product,
        ratingSummary: {
          average: Number(ratingAverage.toFixed(1)),
          count: ratingCount,
        },
        relatedProducts,
      }
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
  filters?: {
    categoryId?: string;
    categoryIds?: string[];
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: "default" | "price-asc" | "price-desc";
    includeDeleted?: boolean;
  }
): Promise<ServerActionResponse<any>> {
  try {
    const skip = (page - 1) * limit;
    const categoryIds = filters?.categoryIds?.filter(Boolean) || [];
    const hasCategoryFilter = Boolean(filters?.categoryId) || categoryIds.length > 0;
    const search = filters?.search?.trim();

    const where: Prisma.ProductWhereInput = {
      ...(filters?.includeDeleted ? {} : { deletedAt: null }),
      ...(filters?.includeDeleted ? {} : { category: { deletedAt: null } }),
      ...(hasCategoryFilter
        ? {
            categoryId: filters?.categoryId
              ? filters.categoryId
              : { in: categoryIds }
          }
        : {}),
      ...(search
        ? {
            OR: [
              { nameUz: { contains: search, mode: "insensitive" } },
              { nameRu: { contains: search, mode: "insensitive" } },
              { descriptionUz: { contains: search, mode: "insensitive" } },
              { descriptionRu: { contains: search, mode: "insensitive" } },
              { slug: { contains: search, mode: "insensitive" } },
            ]
          }
        : {}),
      ...((filters?.minPrice !== undefined || filters?.maxPrice !== undefined)
        ? {
            price: {
              ...(filters?.minPrice !== undefined ? { gte: filters.minPrice } : {}),
              ...(filters?.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
            }
          }
        : {}),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      filters?.sort === "price-asc"
        ? { price: "asc" }
        : filters?.sort === "price-desc"
          ? { price: "desc" }
          : { createdAt: "desc" };

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
        orderBy
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
          pages: Math.max(1, Math.ceil(total / limit))
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
        authorName: validated.authorName,
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

    const existingComment = await prisma.comment.findUnique({
      where: { id },
      select: {
        id: true,
        productId: true,
        authorName: true,
      },
    });

    if (!existingComment) {
      return {
        success: false,
        error: "Comment not found",
      };
    }

    await prisma.comment.delete({
      where: { id }
    });

    await createAuditLog("COMMENT", id, "DELETE", {
      productId: existingComment.productId,
      authorName: existingComment.authorName,
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
          pages: Math.max(1, Math.ceil(total / limit))
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

    const normalizedPhone = normalizePhone(validated.phone);
    if (!normalizedPhone) {
      return {
        success: false,
        error: "Phone must be a valid Uzbekistan number",
        code: "INVALID_PHONE"
      };
    }

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const ip = typeof (input as any)?.clientIp === "string" ? (input as any).clientIp : "";
    const ipHashed = ip ? hashIp(ip) : null;

    // Hard cap bursts from same IP.
    if (ipHashed) {
      const ipBurst = await prisma.lead.count({
        where: {
          ipHash: ipHashed,
          createdAt: { gte: oneMinuteAgo }
        }
      });

      if (ipBurst >= 3) {
        return {
          success: false,
          error: "Too many requests. Please wait a minute and try again.",
          code: "RATE_LIMITED"
        };
      }
    }

    // Block duplicate same-phone leads in short windows.
    const recentPhoneLead = await prisma.lead.findFirst({
      where: {
        phone: normalizedPhone,
        createdAt: { gte: tenMinutesAgo }
      },
      orderBy: { createdAt: "desc" }
    });

    if (recentPhoneLead) {
      return {
        success: false,
        error: "This phone number already submitted a recent request. Please wait a bit.",
        code: "DUPLICATE_LEAD"
      };
    }

    const lead = await prisma.lead.create({
      data: {
        name: validated.name,
        phone: normalizedPhone,
        message: validated.message,
        source: validated.source || "website",
        status: "NEW",
        ipHash: ipHashed
      }
    });

    // Non-blocking notification path.
    void notifyNewLead({
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      message: lead.message,
      source: lead.source,
      createdAt: lead.createdAt
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

    const updateData: Prisma.LeadUpdateInput = {
      status: validated.status,
      lastContactedAt: new Date()
    };

    if (typeof validated.notes === "string") {
      updateData.notes = validated.notes;
    }

    if (validated.nextFollowUpAt !== undefined) {
      updateData.nextFollowUpAt = validated.nextFollowUpAt
        ? new Date(validated.nextFollowUpAt)
        : null;
    }

    const lead = await prisma.lead.update({
      where: { id: validated.id },
      data: updateData
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
  status?: "NEW" | "CONTACTED" | "NEGOTIATION" | "WON" | "LOST" | "NOT_CALLED" | "CALLED"
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
          pages: Math.max(1, Math.ceil(total / limit))
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

export async function getAuditLogs(
  page: number = 1,
  limit: number = 30
): Promise<ServerActionResponse<any>> {
  try {
    await requireRole("ADMIN");

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.count(),
    ]);

    return {
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page,
          limit,
          pages: Math.max(1, Math.ceil(total / limit)),
        },
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch audit logs";
    console.error("[AUDIT] Fetch error:", message);

    return {
      success: false,
      error: message,
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
    await createAuditLog("CATEGORY", category.id, "CREATE", {
      nameUz: category.nameUz,
    });

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

export async function getCategories(
  includeDeleted: boolean = false
): Promise<ServerActionResponse<any>> {
  try {
    const categories = await prisma.category.findMany({
      where: includeDeleted ? {} : { deletedAt: null },
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: {
            products: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
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

export async function deleteCategory(
  id: string
): Promise<ServerActionResponse<void>> {
  try {
    await requireRole("ADMIN");

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    if (!category) {
      return {
        success: false,
        error: "Category not found",
      };
    }

    if (category._count.products > 0) {
      return {
        success: false,
        error: "Category contains active products",
      };
    }

    if (category.deletedAt) {
      return { success: true };
    }

    const actor = await getAuditActor();
    await prisma.category.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: actor.actorUsername || actor.actorId || "system",
      },
    });

    await createAuditLog("CATEGORY", id, "SOFT_DELETE");

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete category";
    console.error("[CATEGORIES] Delete error:", message);

    return {
      success: false,
      error: message,
    };
  }
}

export async function restoreCategory(
  id: string
): Promise<ServerActionResponse<void>> {
  try {
    await requireRole("ADMIN");

    const category = await prisma.category.findUnique({
      where: { id },
      select: { id: true, deletedAt: true },
    });

    if (!category) {
      return {
        success: false,
        error: "Category not found",
      };
    }

    if (!category.deletedAt) {
      return { success: true };
    }

    await prisma.category.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedBy: null,
      },
    });

    await createAuditLog("CATEGORY", id, "RESTORE");

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to restore category";
    console.error("[CATEGORIES] Restore error:", message);

    return {
      success: false,
      error: message,
    };
  }
}
