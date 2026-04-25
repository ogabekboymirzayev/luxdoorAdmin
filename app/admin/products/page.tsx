"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Search, X, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const MAX_PRODUCT_IMAGES = 4;

interface Product {
  id: string;
  nameUz: string;
  nameRu: string;
  price: string;
  oldPrice?: string | null;
  badgeType?: "NONE" | "SALE" | "NEW" | "HIT";
  badgeTextUz?: string | null;
  badgeTextRu?: string | null;
  categoryId: string;
  images: string[];
  descriptionUz: string;
  descriptionRu: string;
  attributes: Record<string, string>;
  deletedAt?: string | null;
  category?: { id: string; nameUz: string; nameRu: string };
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
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
  oldPrice: "",
  badgeType: "NONE" as "NONE" | "SALE" | "NEW" | "HIT",
  badgeTextUz: "",
  badgeTextRu: "",
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
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [attrKeyUz, setAttrKeyUz] = useState("");
  const [attrKeyRu, setAttrKeyRu] = useState("");
  const [attrValUz, setAttrValUz] = useState("");
  const [attrValRu, setAttrValRu] = useState("");
  const [dialog, setDialog] = useState<DialogState>({
    open: false, type: "error", title: "", message: ""
  });
  const [showArchived, setShowArchived] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, pages: 1 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
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
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (showArchived) {
        params.set("includeDeleted", "1");
      }

      const res = await fetch(`${API_URL}/api/products?${params.toString()}`, { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setProducts(data.data.products);
        setPagination(data.data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, pageSize, search, showArchived]);

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
    setImageFiles([]);
    setNewImagePreviews([]);
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
      oldPrice: product.oldPrice || "",
      badgeType: product.badgeType || "NONE",
      badgeTextUz: product.badgeTextUz || "",
      badgeTextRu: product.badgeTextRu || "",
      categoryId: product.categoryId,
      images: product.images,
      attributes: product.attributes || {},
    });
    setImageFiles([]);
    setNewImagePreviews([]);
    setModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    const remainingSlots = MAX_PRODUCT_IMAGES - (form.images.length + imageFiles.length);
    if (remainingSlots <= 0) {
      showError("Limit", `Har bir mahsulot uchun maksimal ${MAX_PRODUCT_IMAGES} ta rasm yuklash mumkin`);
      e.target.value = "";
      return;
    }

    const filesToAdd = selectedFiles.slice(0, remainingSlots);
    if (filesToAdd.length < selectedFiles.length) {
      showError("Limit", `Faqat ${remainingSlots} ta rasm qo'shish mumkin`);
    }

    setImageFiles((prev) => [...prev, ...filesToAdd]);
    setNewImagePreviews((prev) => [...prev, ...filesToAdd.map((file) => URL.createObjectURL(file))]);
    e.target.value = "";
  };

  const removeExistingImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const removeNewImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => {
      const next = [...prev];
      const [removedUrl] = next.splice(index, 1);
      if (removedUrl) URL.revokeObjectURL(removedUrl);
      return next;
    });
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

    if (form.oldPrice && Number(form.oldPrice) < Number(form.price)) {
      showError("Xato", "Eski narx joriy narxdan kichik bo'lmasligi kerak");
      return;
    }

    try {
      setSaving(true);
      let images = [...form.images];
      if (imageFiles.length) {
        const uploadedImages = await Promise.all(imageFiles.map((file) => uploadImage(file)));
        const failedUploads = uploadedImages.some((url) => !url);
        if (failedUploads) {
          showError("Xato", "Rasmlardan biri yuklanmadi. Qayta urinib ko'ring");
          return;
        }
        images = [...images, ...(uploadedImages as string[])];
      }

      if (images.length > MAX_PRODUCT_IMAGES) {
        showError("Limit", `Har bir mahsulot uchun maksimal ${MAX_PRODUCT_IMAGES} ta rasm ruxsat etiladi`);
        return;
      }

      const body = {
        nameUz: form.nameUz,
        nameRu: form.nameRu,
        descriptionUz: form.descriptionUz,
        descriptionRu: form.descriptionRu,
        price: Number(form.price),
        oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
        badgeType: form.badgeType,
        badgeTextUz: form.badgeTextUz.trim() || null,
        badgeTextRu: form.badgeTextRu.trim() || null,
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
        setImageFiles([]);
        setNewImagePreviews((prev) => {
          prev.forEach((url) => URL.revokeObjectURL(url));
          return [];
        });
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

  const handleRestore = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/products/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore" }),
      });
      const data = await res.json();
      if (data.success) fetchProducts();
    } catch (err) {
      console.error(err);
    }
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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Sahifada</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPage(1);
                setPageSize(Number(e.target.value));
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              {[10, 25, 50, 100].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-accent text-white px-6 py-2 rounded-lg hover:shadow-lg transition font-medium">
            <Plus size={20} />
            Add Product
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-slate-400" size={20} />
        <input type="text" placeholder="Search products..." value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none transition" />
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={showArchived} onChange={(e) => {
          setPage(1);
          setShowArchived(e.target.checked);
        }} />
        Archived mahsulotlarni ko'rsatish
      </label>

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
              ) : products.map((product) => {
                const imgUrl = product.images?.[0]
                  ? product.images[0].startsWith("http")
                    ? product.images[0]
                    : `${API_URL}${product.images[0]}`
                  : null;
                return (
                  <tr key={product.id} className={`hover:bg-slate-50 transition ${product.deletedAt ? "opacity-60" : ""}`}>
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">{product.nameUz}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{product.nameRu}</td>
                    <td className="px-6 py-4 text-sm font-semibold">
                      <div className="flex flex-col">
                        <span>{Number(product.price).toLocaleString("uz-UZ")} so'm</span>
                        {product.oldPrice && (
                          <span className="text-xs text-slate-400 line-through">
                            {Number(product.oldPrice).toLocaleString("uz-UZ")} so'm
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {imgUrl
                        ? <img src={imgUrl} alt={product.nameUz} className="w-10 h-10 rounded object-cover" />
                        : <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-xs text-slate-400">Yo'q</div>
                      }
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {!product.deletedAt && (
                          <button onClick={() => openEdit(product)} className="p-2 hover:bg-blue-50 text-blue-600 rounded transition">
                            <Edit2 size={18} />
                          </button>
                        )}
                        {product.deletedAt ? (
                          <button onClick={() => handleRestore(product.id)} className="p-2 hover:bg-emerald-50 text-emerald-600 rounded transition">
                            <RotateCcw size={18} />
                          </button>
                        ) : (
                          <button onClick={() => handleDelete(product.id)} className="p-2 hover:bg-red-50 text-red-600 rounded transition">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!loading && products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-600">Mahsulot topilmadi</p>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-600">
            Jami {pagination.total} ta mahsulotdan {products.length} tasi ko'rsatilmoqda
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
              Oldingi
            </button>
            <span className="px-3 py-2 text-sm text-slate-600">
              {pagination.page} / {pagination.pages}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(pagination.pages, prev + 1))}
              disabled={page >= pagination.pages}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
            >
              Keyingi
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-900 text-sm font-medium">Jami mahsulotlar</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{pagination.total || products.length} ta</p>
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
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Eski narx (aksiya uchun)</label>
                  <input type="number" value={form.oldPrice} onChange={(e) => setForm({ ...form, oldPrice: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    placeholder="850000" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Badge turi</label>
                  <select
                    value={form.badgeType}
                    onChange={(e) => setForm({ ...form, badgeType: e.target.value as "NONE" | "SALE" | "NEW" | "HIT" })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="NONE">Yo'q</option>
                    <option value="SALE">Aksiya</option>
                    <option value="NEW">Yangi</option>
                    <option value="HIT">Hit</option>
                  </select>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Badge matni (UZ)</label>
                  <input value={form.badgeTextUz} onChange={(e) => setForm({ ...form, badgeTextUz: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Aksiya" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Badge matni (RU)</label>
                  <input value={form.badgeTextRu} onChange={(e) => setForm({ ...form, badgeTextRu: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Акция" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Rasmlar (maksimal 4 ta)</label>
                <input type="file" accept="image/*" multiple onChange={handleImageChange}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />

                {(form.images.length > 0 || newImagePreviews.length > 0) && (
                  <div className="mt-3 space-y-3">
                    {form.images.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500 mb-2">Mavjud rasmlar</p>
                        <div className="grid grid-cols-4 gap-2">
                          {form.images.map((image, index) => {
                            const previewUrl = image.startsWith("http") ? image : `${API_URL}${image}`;
                            return (
                              <div key={`${image}-${index}`} className="relative group">
                                <img src={previewUrl} alt={`existing-${index + 1}`} className="w-full h-20 object-cover rounded-lg border border-slate-200" />
                                <button
                                  type="button"
                                  onClick={() => removeExistingImage(index)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {newImagePreviews.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500 mb-2">Yangi yuklanayotgan rasmlar</p>
                        <div className="grid grid-cols-4 gap-2">
                          {newImagePreviews.map((preview, index) => (
                            <div key={`${preview}-${index}`} className="relative group">
                              <img src={preview} alt={`new-${index + 1}`} className="w-full h-20 object-cover rounded-lg border border-slate-200" />
                              <button
                                type="button"
                                onClick={() => removeNewImage(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-slate-500">
                      Jami: {form.images.length + newImagePreviews.length}/{MAX_PRODUCT_IMAGES}
                    </p>
                  </div>
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