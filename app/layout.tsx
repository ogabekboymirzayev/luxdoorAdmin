import type { Metadata } from "next";
import { AuthProvider } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lux Door Dealer Hub - Admin Backend",
  description: "Production-ready backend for Lux Door e-commerce platform"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
