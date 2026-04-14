"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, X } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Category {
    id: string;
    nameUz: string;
    nameRu: string;
    _count?: { products: number };
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [nameUz, setNameUz] = useState("");
    const [nameRu, setNameRu] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchCategories(); }, []);

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
        if (!nameUz || !nameRu) { alert("Ikkala tilda ham nom kiriting"); return; }
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
                alert(data.error || "Xato yuz berdi");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, productCount: number) => {
        if (productCount > 0) {
            alert(`Bu kategoriyada ${productCount} ta mahsulot bor. Avval mahsulotlarni o'chiring.`);
            return;
        }
        if (!confirm("Kategoriyani o'chirishni tasdiqlaysizmi?")) return;
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

            {/* Modal */}
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
        </div>
    );
}