"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Search, X, AlertTriangle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Product {
  id: string;
  nameUz: string;
  nameRu: string;
  price: string;
  categoryId: string;
  images: string[];
  descriptionUz: string;
  descriptionRu: string;
  attributes: Record<string, string>;
  category?: { id: string; nameUz: string; nameRu: string };
}

interface Category {
  id: string;
  nameUz: string;
  nameRu: string;
}

interface DialogState {
  open: boolean;
  type: "error" | "confirm";
  title: string;
  message: string;
  onConfirm?: () => void;
}

const emptyForm = {
  nameUz: "",
  nameRu: "",
  descriptionUz: "",
  descriptionRu: "",
  price: "",
  categoryId: "",
  images: [] as string[],
  attributes: {} as Record<string, string>,
};

const CARD_COLORS = [
  { bg: "bg-orange-50", border: "border-orange-200", label: "text-orange-900", value: "text-orange-600", sub: "text-orange-500" },
  { bg: "bg-teal-50", border: "border-teal-200", label: "text-teal-900", value: "text-teal-600", sub: "text-teal-500" },
  { bg: "bg-pink-50", border: "border-pink-200", label: "text-pink-900", value: "text-pink-600", sub: "text-pink-500" },
  { bg: "bg-indigo-50", border: "border-indigo-200", label: "text-indigo-900", value: "text-indigo-600", sub: "text-indigo-500" },
  { bg: "bg-yellow-50", border: "border-yellow-200", label: "text-yellow-900", value: "text-yellow-600", sub: "text-yellow-500" },
  { bg: "bg-rose-50", border: "border-rose-200", label: "text-rose-900", value: "text-rose-600", sub: "text-rose-500" },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [attrKeyUz, setAttrKeyUz] = useState("");
  const [attrKeyRu, setAttrKeyRu] = useState("");
  const [attrValUz, setAttrValUz] = useState("");
  const [attrValRu, setAttrValRu] = useState("");
  const [dialog, setDialog] = useState<DialogState>({
    open: false, type: "error", title: "", message: ""
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const showError = (title: string, message: string) => {
    setDialog({ open: true, type: "error", title, message });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setDialog({ open: true, type: "confirm", title, message, onConfirm });
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/products?limit=100`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setProducts(data.data.products);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/api/categories`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setCategories(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const openAdd = () => {
    setEditProduct(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview(null);
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditProduct(product);
    setForm({
      nameUz: product.nameUz,
      nameRu: product.nameRu,
      descriptionUz: product.descriptionUz,
      descriptionRu: product.descriptionRu,
      price: product.price,
      categoryId: product.categoryId,
      images: product.images,
      attributes: product.attributes || {},
    });
    setImagePreview(
      product.images?.[0]
        ? product.images[0].startsWith("http")
          ? product.images[0]
          : `${API_URL}${product.images[0]}`
        : null
    );
    setImageFile(null);
    setModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const res = await fetch(`${API_URL}/api/admin/upload`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64, folder: "products" }),
    });
    const data = await res.json();
    return data.success ? data.data.url : null;
  };

  const handleSave = async () => {
    if (!form.nameUz || !form.nameRu || !form.price || !form.categoryId) {
      showError("Xato", "Barcha majburiy maydonlarni to'ldiring");
      return;
    }
    try {
      setSaving(true);
      let images = form.images;
      if (imageFile) {
        const url = await uploadImage(imageFile);
        if (url) images = [url];
      }
      const body = {
        nameUz: form.nameUz,
        nameRu: form.nameRu,
        descriptionUz: form.descriptionUz,
        descriptionRu: form.descriptionRu,
        price: Number(form.price),
        categoryId: form.categoryId,
        images,
        attributes: form.attributes,
      };
      const url = editProduct
        ? `${API_URL}/api/products/${editProduct.id}`
        : `${API_URL}/api/products`;
      const res = await fetch(url, {
        method: editProduct ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        fetchProducts();
      } else {
        showError("Xato", data.error || "Xato yuz berdi");
      }
    } catch (err) {
      console.error(err);
      showError("Xato", "Xato yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    showConfirm(
      "Mahsulotni o'chirish",
      "Ushbu mahsulotni o'chirishni tasdiqlaysizmi?",
      async () => {
        try {
          const res = await fetch(`${API_URL}/api/products/${id}`, {
            method: "DELETE",
            credentials: "include",
          });
          const data = await res.json();
          if (data.success) fetchProducts();
        } catch (err) {
          console.error(err);
        }
      }
    );
  };

  const addAttribute = () => {
    if (!attrKeyUz || !attrValUz) return;
    const combinedKey = attrKeyRu ? `${attrKeyUz}||${attrKeyRu}` : attrKeyUz;
    const combinedVal = attrValRu ? `${attrValUz}||${attrValRu}` : attrValUz;
    setForm({ ...form, attributes: { ...form.attributes, [combinedKey]: combinedVal } });
    setAttrKeyUz("");
    setAttrKeyRu("");
    setAttrValUz("");
    setAttrValRu("");
  };

  const removeAttribute = (key: string) => {
    const attrs = { ...form.attributes };
    delete attrs[key];
    setForm({ ...form, attributes: attrs });
  };

  const filtered = products.filter(
    (p) =>
      p.nameUz.toLowerCase().includes(search.toLowerCase()) ||
      p.nameRu.toLowerCase().includes(search.toLowerCase())
  );

  const totalValue = products.reduce((s, p) => s + Number(p.price), 0);
  const avgPrice = products.length ? Math.round(totalValue / products.length) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Products</h1>
          <p className="text-slate-600 mt-1">Manage your product catalog</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-gradient-to-r from-primary to-accent text-white px-6 py-2 rounded-lg hover:shadow-lg transition font-medium">
          <Plus size={20} />
          Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-slate-400" size={20} />
        <input type="text" placeholder="Search products..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none transition" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Product (UZ)</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Product (RU)</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Price</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Image</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12 text-slate-400">Yuklanmoqda...</td></tr>
              ) : filtered.map((product) => {
                const imgUrl = product.images?.[0]
                  ? product.images[0].startsWith("http")
                    ? product.images[0]
                    : `${API_URL}${product.images[0]}`
                  : null;
                return (
                  <tr key={product.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">{product.nameUz}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{product.nameRu}</td>
                    <td className="px-6 py-4 text-sm font-semibold">{Number(product.price).toLocaleString("uz-UZ")} so'm</td>
                    <td className="px-6 py-4">
                      {imgUrl
                        ? <img src={imgUrl} alt={product.nameUz} className="w-10 h-10 rounded object-cover" />
                        : <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-xs text-slate-400">Yo'q</div>
                      }
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(product)} className="p-2 hover:bg-blue-50 text-blue-600 rounded transition">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="p-2 hover:bg-red-50 text-red-600 rounded transition">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-600">Mahsulot topilmadi</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-900 text-sm font-medium">Jami mahsulotlar</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{products.length} ta</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-900 text-sm font-medium">Umumiy qiymat</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{totalValue.toLocaleString("uz-UZ")} so'm</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-purple-900 text-sm font-medium">O'rtacha narx</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{avgPrice.toLocaleString("uz-UZ")} so'm</p>
        </div>
      </div>

      {/* Category Breakdown */}
      {categories.length > 0 && (
        <>
          <h2 className="text-lg font-bold text-slate-900 -mb-2">Kategoriya bo'yicha taqsimot</h2>
          <div className="grid grid-cols-3 gap-4">
            {categories.map((cat, i) => {
              const color = CARD_COLORS[i % CARD_COLORS.length];
              const catProducts = products.filter((p) => p.categoryId === cat.id);
              const catTotal = catProducts.reduce((s, p) => s + Number(p.price), 0);
              const percent = totalValue > 0 ? Math.round((catTotal / totalValue) * 100) : 0;
              return (
                <div key={cat.id} className={`${color.bg} border ${color.border} rounded-lg p-4`}>
                  <p className={`${color.label} text-sm font-medium`}>{cat.nameUz}</p>
                  <p className={`text-2xl font-bold ${color.value} mt-1`}>{catTotal.toLocaleString("uz-UZ")} so'm</p>
                  <p className={`text-xs ${color.sub} mt-1`}>{catProducts.length} ta mahsulot · {percent}%</p>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {editProduct ? "Mahsulotni tahrirlash" : "Yangi mahsulot qo'shish"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Nomi (UZ) *</label>
                  <input value={form.nameUz} onChange={(e) => setForm({ ...form, nameUz: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    placeholder="O'zbekcha nomi" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Nomi (RU) *</label>
                  <input value={form.nameRu} onChange={(e) => setForm({ ...form, nameRu: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ruscha nomi" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Tavsif (UZ)</label>
                  <textarea value={form.descriptionUz} onChange={(e) => setForm({ ...form, descriptionUz: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    rows={3} placeholder="O'zbekcha tavsif" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Tavsif (RU)</label>
                  <textarea value={form.descriptionRu} onChange={(e) => setForm({ ...form, descriptionRu: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    rows={3} placeholder="Ruscha tavsif" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Narx (so'm) *</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    placeholder="750000" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Kategoriya *</label>
                  <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Kategoriya tanlang</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.nameUz}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Rasm</label>
                <input type="file" accept="image/*" onChange={handleImageChange}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                {imagePreview && (
                  <img src={imagePreview} alt="preview" className="mt-2 w-32 h-32 object-cover rounded-lg" />
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Xususiyatlar</label>
                <div className="bg-slate-50 rounded-lg p-3 mb-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input value={attrKeyUz} onChange={(e) => setAttrKeyUz(e.target.value)}
                      placeholder="Kalit UZ (masalan: Rang)"
                      className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary bg-white" />
                    <input value={attrKeyRu} onChange={(e) => setAttrKeyRu(e.target.value)}
                      placeholder="Kalit RU (masalan: Цвет)"
                      className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary bg-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={attrValUz} onChange={(e) => setAttrValUz(e.target.value)}
                      placeholder="Qiymat UZ (masalan: Qora)"
                      className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary bg-white" />
                    <input value={attrValRu} onChange={(e) => setAttrValRu(e.target.value)}
                      placeholder="Qiymat RU (masalan: Чёрный)"
                      className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary bg-white" />
                  </div>
                  <button onClick={addAttribute}
                    className="w-full px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700">
                    + Xususiyat qo'shish
                  </button>
                </div>
                {Object.entries(form.attributes).map(([key, val]) => {
                  const keyParts = key.split("||");
                  const valParts = (val as string).split("||");
                  return (
                    <div key={key} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2 mb-1 text-sm">
                      <div>
                        <span className="font-medium text-slate-700">
                          {keyParts[0]}{keyParts[1] ? ` / ${keyParts[1]}` : ""}:
                        </span>
                        <span className="text-slate-600 ml-2">{valParts[0]}</span>
                        {valParts[1] && <span className="text-slate-400 ml-1">/ {valParts[1]}</span>}
                      </div>
                      <button onClick={() => removeAttribute(key)} className="text-red-500 hover:text-red-700 ml-3">
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button onClick={() => setModalOpen(false)}
                  className="px-6 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">
                  Bekor qilish
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="px-6 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-lg text-sm hover:shadow-lg disabled:opacity-50">
                  {saving ? "Saqlanmoqda..." : editProduct ? "Saqlash" : "Qo'shish"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chiroyli Dialog */}
      {dialog.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
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
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">
                      Bekor qilish
                    </button>
                    <button
                      onClick={() => {
                        setDialog({ ...dialog, open: false });
                        dialog.onConfirm?.();
                      }}
                      className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600">
                      O'chirish
                    </button>
                  </>
                )}
                {dialog.type === "error" && (
                  <button
                    onClick={() => setDialog({ ...dialog, open: false })}
                    className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800">
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