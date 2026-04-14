"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, X, AlertTriangle, CheckCircle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Category {
  id: string;
  nameUz: string;
  nameRu: string;
  _count?: { products: number };
}

interface DialogState {
  open: boolean;
  type: "error" | "confirm";
  title: string;
  message: string;
  onConfirm?: () => void;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [nameUz, setNameUz] = useState("");
  const [nameRu, setNameRu] = useState("");
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({
    open: false, type: "error", title: "", message: ""
  });

  useEffect(() => { fetchCategories(); }, []);

  const showError = (title: string, message: string) => {
    setDialog({ open: true, type: "error", title, message });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setDialog({ open: true, type: "confirm", title, message, onConfirm });
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/categories`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setCategories(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!nameUz || !nameRu) {
      showError("Xato", "Ikkala tilda ham nom kiriting");
      return;
    }
    try {
      setSaving(true);
      const res = await fetch(`${API_URL}/api/categories`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nameUz, nameRu }),
      });
      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        setNameUz("");
        setNameRu("");
        fetchCategories();
      } else {
        showError("Xato", data.error || "Xato yuz berdi");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string, productCount: number) => {
    if (productCount > 0) {
      showError(
        "O'chirib bo'lmaydi",
        `Bu kategoriyada ${productCount} ta mahsulot bor. Avval mahsulotlarni o'chiring.`
      );
      return;
    }
    showConfirm(
      "Kategoriyani o'chirish",
      "Ushbu kategoriyani o'chirishni tasdiqlaysizmi?",
      async () => {
        try {
          const res = await fetch(`${API_URL}/api/categories`, {
            method: "DELETE",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
          });
          const data = await res.json();
          if (data.success) fetchCategories();
        } catch (err) {
          console.error(err);
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Kategoriyalar</h1>
          <p className="text-slate-600 mt-1">Mahsulot kategoriyalarini boshqaring</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-primary to-accent text-white px-6 py-2 rounded-lg hover:shadow-lg transition font-medium"
        >
          <Plus size={20} />
          Kategoriya qo'shish
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Nomi (UZ)</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Nomi (RU)</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Mahsulotlar</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr><td colSpan={4} className="text-center py-12 text-slate-400">Yuklanmoqda...</td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-12 text-slate-400">Kategoriya topilmadi</td></tr>
            ) : categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4 text-sm font-medium text-slate-900">{cat.nameUz}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{cat.nameRu}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{cat._count?.products ?? 0} ta</td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDelete(cat.id, cat._count?.products ?? 0)}
                    className="p-2 hover:bg-red-50 text-red-600 rounded transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Kategoriya qo'shish modali */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">Yangi kategoriya</h2>
              <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Nomi (O'zbek) *</label>
                <input
                  value={nameUz}
                  onChange={(e) => setNameUz(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  placeholder="masalan: ECO Shpon"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Nomi (Rus) *</label>
                <input
                  value={nameRu}
                  onChange={(e) => setNameRu(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  placeholder="например: ECO Шпон"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button onClick={() => setModalOpen(false)} className="px-6 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">
                  Bekor qilish
                </button>
                <button
                  onClick={handleCreate}
                  disabled={saving}
                  className="px-6 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-lg text-sm hover:shadow-lg disabled:opacity-50"
                >
                  {saving ? "Saqlanmoqda..." : "Qo'shish"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chiroyli Dialog */}
      {dialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex flex-col items-center text-center">
              {dialog.type === "error" ? (
                <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle size={28} className="text-red-500" />
                </div>
              ) : (
                <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                  <Trash2 size={28} className="text-amber-500" />
                </div>
              )}
              <h3 className="text-lg font-bold text-slate-900 mb-2">{dialog.title}</h3>
              <p className="text-sm text-slate-600 mb-6">{dialog.message}</p>
              <div className="flex gap-3 w-full">
                {dialog.type === "confirm" && (
                  <>
                    <button
                      onClick={() => setDialog({ ...dialog, open: false })}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
                    >
                      Bekor qilish
                    </button>
                    <button
                      onClick={() => {
                        setDialog({ ...dialog, open: false });
                        dialog.onConfirm?.();
                      }}
                      className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                    >
                      O'chirish
                    </button>
                  </>
                )}
                {dialog.type === "error" && (
                  <button
                    onClick={() => setDialog({ ...dialog, open: false })}
                    className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800"
                  >
                    Tushunarli
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}