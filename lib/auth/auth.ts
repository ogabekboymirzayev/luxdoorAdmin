import { getServerSession } from "next-auth";
import { authOptions } from "./authOptions";
import type { Session } from "next-auth";

/**
 * Get the current user's session
 */
export async function getCurrentSession(): Promise<Session | null> {
  return getServerSession(authOptions);
}

/**
 * Get the current user or throw error if not authenticated
 */
export async function requireAuth() {
  const session = await getCurrentSession();

  if (!session || !session.user) {
    throw new Error("Unauthorized: Please log in");
  }

  return session;
}

/**
 * Require specific role - throws error if user doesn't have required role
 * @param requiredRole - The role required (SUPERADMIN or ADMIN)
 */
export async function requireRole(requiredRole: "SUPERADMIN" | "ADMIN") {
  const session = await requireAuth();
  const userRole = (session.user as any).role;

  if (requiredRole === "SUPERADMIN" && userRole !== "SUPERADMIN") {
    throw new Error(
      "Forbidden: Only SUPERADMIN can perform this action"
    );
  }

  return session;
}

/**
 * Check if user has specific role
 */
export async function hasRole(role: "SUPERADMIN" | "ADMIN"): Promise<boolean> {
  const session = await getCurrentSession();

  if (!session?.user) {
    return false;
  }

  return (session.user as any).role === role;
}

/**
 * Get current user ID from session
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getCurrentSession();
  return (session?.user as any)?.id || null;
}
