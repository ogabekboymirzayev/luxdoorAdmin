"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, LogOut, LayoutDashboard, Package, PhoneCall, Users, Tag } from "lucide-react";

export default function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && status === "unauthenticated" && pathname !== "/admin/login") {
      router.push("/admin/login");
    }
  }, [status, isClient, router, pathname]);

  // Don't require auth for login page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (!isClient || status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  const userRole = (session?.user as any)?.role;
  const username = (session?.user as any)?.username;

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin", color: "text-blue-600" },
    { icon: Package, label: "Products", href: "/admin/products", color: "text-green-600" },
    { icon: Tag, label: "Kategoriyalar", href: "/admin/categories", color: "text-teal-600" },
    { icon: PhoneCall, label: "Leads", href: "/admin/leads", color: "text-orange-600" },
    ...(userRole === "SUPERADMIN"
      ? [{ icon: Users, label: "Users", href: "/admin/users", color: "text-purple-600" }]
      : []
    ),
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "w-64" : "w-20"
          } bg-white border-r border-slate-200 transition-all duration-300 flex flex-col shadow-sm`}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Musa Door
              </h1>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-400 hover:text-slate-600 transition"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-100 rounded-lg transition group"
            >
              <item.icon className={`w-5 h-5 ${item.color}`} />
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 space-y-3">
          {sidebarOpen && (
            <div className="px-3 py-2 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 mb-1">Logged in as</p>
              <p className="text-sm font-medium text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                {username}
              </p>
              {userRole && (
                <p className="text-xs text-accent font-semibold mt-1">{userRole}</p>
              )}
            </div>
          )}
          <button
            onClick={() => signOut({ redirect: true, callbackUrl: "/admin/login" })}
            className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition text-sm font-medium"
          >
            <LogOut size={18} />
            {sidebarOpen && "Logout"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">Admin Panel</h2>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{username}</p>
              <p className="text-xs text-slate-500">{userRole}</p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
