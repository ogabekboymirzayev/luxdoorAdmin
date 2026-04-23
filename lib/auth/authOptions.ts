import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import type { NextAuthOptions } from "next-auth";

type LoginAttemptState = {
  count: number;
  firstAttemptAt: number;
  blockedUntil?: number;
};

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;

const globalAuthState = globalThis as unknown as {
  __luxdoorLoginAttempts?: Map<string, LoginAttemptState>;
};

const loginAttempts = globalAuthState.__luxdoorLoginAttempts || new Map<string, LoginAttemptState>();
globalAuthState.__luxdoorLoginAttempts = loginAttempts;

function checkAuthRateLimit(key: string): { blocked: boolean; retryAfterSec?: number } {
  const current = loginAttempts.get(key);
  const now = Date.now();

  if (!current) {
    return { blocked: false };
  }

  if (current.blockedUntil && current.blockedUntil > now) {
    return {
      blocked: true,
      retryAfterSec: Math.ceil((current.blockedUntil - now) / 1000),
    };
  }

  if (current.firstAttemptAt + WINDOW_MS < now) {
    loginAttempts.delete(key);
    return { blocked: false };
  }

  return { blocked: false };
}

function registerFailedAttempt(key: string) {
  const now = Date.now();
  const current = loginAttempts.get(key);

  if (!current || current.firstAttemptAt + WINDOW_MS < now) {
    loginAttempts.set(key, {
      count: 1,
      firstAttemptAt: now,
    });
    return;
  }

  const nextCount = current.count + 1;
  loginAttempts.set(key, {
    ...current,
    count: nextCount,
    blockedUntil: nextCount >= MAX_ATTEMPTS ? now + BLOCK_MS : current.blockedUntil,
  });
}

function clearAttempts(key: string) {
  loginAttempts.delete(key);
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "username" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        // Validate input
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const loginKey = credentials.username.trim().toLowerCase();
        const rateState = checkAuthRateLimit(loginKey);
        if (rateState.blocked) {
          throw new Error(`Too many attempts. Try again in ${rateState.retryAfterSec || 60}s`);
        }

        try {
          // Find user by username
          const user = await prisma.user.findUnique({
            where: { username: credentials.username }
          });

          if (!user) {
            registerFailedAttempt(loginKey);
            throw new Error("Invalid credentials");
          }

          // Verify password
          const isPasswordValid = await verifyPassword(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            registerFailedAttempt(loginKey);
            throw new Error("Invalid credentials");
          }

          clearAttempts(loginKey);

          // Return user object (without password)
          return {
            id: user.id,
            username: user.username,
            role: user.role
          };
        } catch (error) {
          console.error("[AUTH] Login error:", error);
          throw new Error("Authentication failed");
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    updateAge: 24 * 60 * 60 // Update every 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).id = token.id;
        (session.user as any).username = token.username;
        (session.user as any).role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login"
  },
  secret: process.env.NEXTAUTH_SECRET,
  events: {
    async signIn({ user, isNewUser }) {
      console.log(`[AUTH] User signed in: ${(user as any).username}`);
    },
    async signOut({ token }) {
      console.log(`[AUTH] User signed out`);
    }
  }
};

export const handler = NextAuth(authOptions);