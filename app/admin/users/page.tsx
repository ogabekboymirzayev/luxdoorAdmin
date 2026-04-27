"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Shield, User, Eye, EyeOff } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface AdminUser {
  id: string;
  username: string;
  role: "SUPERADMIN" | "ADMIN";
  createdAt: string;
}

export default function UsersPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/admin/users`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setAdmins(data.data);
      } else {
        setError(data.error || "Failed to fetch admins");
      }
    } catch (err) {
      setError("Server bilan ulanishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.username || !formData.password) {
      setFormError("Barcha maydonlarni to'ldiring");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${API_URL}/api/admin/users`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        setAdmins((prev) => [...prev, data.data]);
        setFormData({ username: "", password: "" });
        setShowForm(false);
        setShowPassword(false);
      } else {
        setFormError(data.error || "Admin yaratishda xatolik");
      }
    } catch (err) {
      setFormError("Server bilan ulanishda xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (id: string, username: string) => {
    if (!confirm(`${username} ni o'chirishni tasdiqlaysizmi?`)) return;

    try {
      const res = await fetch(`${API_URL}/api/admin/users?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();

      if (data.success) {
        setAdmins((prev) => prev.filter((a) => a.id !== id));
      } else {
        alert(data.error || "O'chirishda xatolik");
      }
    } catch (err) {
      alert("Server bilan ulanishda xatolik");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Manage Admin Users</h1>
          <p className="text-slate-600 mt-1">SuperAdmin only - Create and manage admin accounts</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setFormError(""); setShowPassword(false); }}
          className="flex items-center gap-2 bg-gradient-to-r from-primary to-accent text-white px-6 py-2 rounded-lg hover:shadow-lg transition font-medium"
        >
          <Plus size={20} />
          Add Admin
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Create New Admin</h2>
          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {formError}
            </div>
          )}
          <form onSubmit={handleAddAdmin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Foydalanuvchi nomi
              </label>
              <input
                type="text"
                placeholder="Enter username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Parol
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 8 ta belgi, katta harf, raqam, belgi"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 pr-12 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-primary to-accent text-white py-2 rounded-lg hover:shadow-lg transition font-medium disabled:opacity-50"
              >
                {submitting ? "Yaratilmoqda..." : "Create Admin"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setFormError(""); setShowPassword(false); }}
                className="flex-1 bg-slate-200 text-slate-900 py-2 rounded-lg hover:bg-slate-300 transition font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-purple-900 text-sm font-medium">Total Admins</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">
            {loading ? "..." : admins.length}
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-900 text-sm font-medium">SuperAdmins</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {loading ? "..." : admins.filter((a) => a.role === "SUPERADMIN").length}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Admins Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Foydalanuvchi</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Rol</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Qo'shilgan sana</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Harakatlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                [...Array(2)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4} className="px-6 py-4">
                      <div className="h-6 bg-slate-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <User size={18} className="text-slate-400" />
                        {admin.username}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                        admin.role === "SUPERADMIN"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        <Shield size={14} />
                        {admin.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(admin.createdAt).toLocaleDateString("uz-UZ")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {admin.role !== "SUPERADMIN" && (
                        <button
                          onClick={() => handleDeleteAdmin(admin.id, admin.username)}
                          className="p-2 hover:bg-red-50 text-red-600 rounded transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && admins.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-600">Admin users topilmadi</p>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-900 font-semibold mb-2">ℹ️ Ma'lumot:</p>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>• Faqat SUPERADMIN admin yarata oladi</li>
          <li>• Har bir admin qo'shilgan vaqtidan boshlab login qila oladi</li>
          <li>• Default superadmin o'chirib bo'lmaydi</li>
        </ul>
      </div>
    </div>
  );
}