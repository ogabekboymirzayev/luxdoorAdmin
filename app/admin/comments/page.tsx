"use client";

import { useEffect, useState } from "react";
import { Star, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface AdminComment {
  id: string;
  authorName: string;
  text: string;
  rating: number;
  createdAt: string;
  product: {
    id: string;
    nameUz: string;
    nameRu: string;
  };
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/admin/comments?page=${page}&limit=${pageSize}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setComments(data.data.comments);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [page, pageSize]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Ushbu izohni o'chirishni tasdiqlaysizmi?")) return;

    try {
      const res = await fetch(`${API_URL}/api/admin/comments?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        if (comments.length === 1 && page > 1) {
          setPage((prev) => prev - 1);
        } else {
          fetchComments();
        }
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  const renderStars = (rating: number) =>
    [...Array(5)].map((_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${index < rating ? "fill-amber-500 text-amber-500" : "text-gray-300"}`}
      />
    ));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Comments</h1>
          <p className="text-slate-600 mt-1">Qoldirilgan izohlarni ko'rish va o'chirish</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">Sahifada</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPage(1);
              setPageSize(Number(e.target.value));
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Mahsulot</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Muallif</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Izoh</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Reyting</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Vaqt</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500">
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : comments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500">
                    Izoh topilmadi
                  </td>
                </tr>
              ) : (
                comments.map((comment) => (
                  <tr key={comment.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">
                      {comment.product.nameUz}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{comment.authorName}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-md truncate">{comment.text}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-0.5">{renderStars(comment.rating)}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(comment.createdAt).toLocaleString("uz-UZ")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                      >
                        <Trash2 className="w-4 h-4" />
                        O'chirish
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-600">
            Jami {pagination.total} ta izohdan {comments.length} tasi ko'rsatilmoqda
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
    </div>
  );
}