import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import type { NextAuthOptions } from "next-auth";

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

        try {
          // Find user by username
          const user = await prisma.user.findUnique({
            where: { username: credentials.username }
          });

          if (!user) {
            throw new Error("Invalid credentials");
          }

          // Verify password
          const isPasswordValid = await verifyPassword(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            throw new Error("Invalid credentials");
          }

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