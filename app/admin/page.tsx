"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, Package, PhoneCall, Users } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface RecentLead {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
  status: string;
}

interface RecentProduct {
  id: string;
  nameUz: string;
  createdAt: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState({ products: 0, leads: 0, users: 0 });
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [productsRes, leadsRes, usersRes] = await Promise.all([
          fetch(`${API_URL}/api/products?limit=5`, { credentials: "include" }),
          fetch(`${API_URL}/api/leads?limit=5`, { credentials: "include" }),
          fetch(`${API_URL}/api/admin/users`, { credentials: "include" }),
        ]);

        const [productsData, leadsData, usersData] = await Promise.all([
          productsRes.json(),
          leadsRes.json(),
          usersRes.json(),
        ]);

        setStats({
          products: productsData.success ? productsData.data.pagination.total : 0,
          leads: leadsData.success ? leadsData.data.pagination.total : 0,
          users: usersData.success ? usersData.data.length : 0,
        });

        if (leadsData.success) setRecentLeads(leadsData.data.leads.slice(0, 3));
        if (productsData.success) setRecentProducts(productsData.data.products.slice(0, 3));
      } catch (error) {
        console.error("Failed to load stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const statCards = [
    {
      icon: Package,
      label: "Products",
      value: stats.products,
      color: "bg-blue-50",
      borderColor: "border-blue-200",
      iconColor: "text-blue-600",
      href: "/admin/products",
    },
    {
      icon: PhoneCall,
      label: "Leads",
      value: stats.leads,
      color: "bg-orange-50",
      borderColor: "border-orange-200",
      iconColor: "text-orange-600",
      href: "/admin/leads",
    },
    {
      icon: Users,
      label: "Users",
      value: stats.users,
      color: "bg-purple-50",
      borderColor: "border-purple-200",
      iconColor: "text-purple-600",
      href: "/admin/users",
    },
  ];

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} kun oldin`;
    if (hours > 0) return `${hours} soat oldin`;
    return `${mins} daqiqa oldin`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-2">Welcome back to your admin panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`${item.color} ${item.borderColor} rounded-lg p-6 border transition hover:shadow-md`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-600 text-sm font-medium">{item.label}</p>
                <p className="text-4xl font-bold text-slate-900 mt-3">
                  {loading ? "..." : item.value}
                </p>
              </div>
              <item.icon className={`w-12 h-12 ${item.iconColor}`} />
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions + Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link
              href="/admin/products"
              className="block px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-lg transition font-medium text-sm"
            >
              + Yangi mahsulot qo'shish
            </Link>
            <Link
              href="/admin/categories"
              className="block px-4 py-3 bg-teal-50 hover:bg-teal-100 text-teal-900 rounded-lg transition font-medium text-sm"
            >
              + Kategoriya qo'shish
            </Link>
            <Link
              href="/admin/leads"
              className="block px-4 py-3 bg-orange-50 hover:bg-orange-100 text-orange-900 rounded-lg transition font-medium text-sm"
            >
              Barcha leadlarni ko'rish
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">So'nggi faoliyat</h2>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {recentProducts.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-xl">📦</span>
                  <div className="flex-1">
                    <p className="text-slate-900 font-medium text-sm">{p.nameUz}</p>
                    <p className="text-slate-500 text-xs">{formatTime(p.createdAt)}</p>
                  </div>
                </div>
              ))}
              {recentLeads.map((l) => (
                <div key={l.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-xl">📞</span>
                  <div className="flex-1">
                    <p className="text-slate-900 font-medium text-sm">{l.name} — {l.phone}</p>
                    <p className="text-slate-500 text-xs">{formatTime(l.createdAt)}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    l.status === "CALLED"
                      ? "bg-green-100 text-green-700"
                      : "bg-orange-100 text-orange-700"
                  }`}>
                    {l.status === "CALLED" ? "Qilindi" : "Kutilmoqda"}
                  </span>
                </div>
              ))}
              {recentProducts.length === 0 && recentLeads.length === 0 && (
                <p className="text-slate-400 text-sm text-center py-4">Ma'lumot yo'q</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="bg-gradient-to-r from-primary to-accent rounded-lg text-white p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-2">System Status</h2>
        <p className="text-white/90">All systems operational</p>
        <div className="mt-4 pt-4 border-t border-white/20 flex gap-6 text-sm">
          <div>
            <p className="text-white/70">Database</p>
            <p className="text-white font-medium mt-1">✓ Connected</p>
          </div>
          <div>
            <p className="text-white/70">API</p>
            <p className="text-white font-medium mt-1">✓ Active</p>
          </div>
          <div>
            <p className="text-white/70">Storage</p>
            <p className="text-white font-medium mt-1">✓ Healthy</p>
          </div>
        </div>
      </div>
    </div>
  );
}