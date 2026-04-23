"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorUsername?: string | null;
  actorId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/admin/audit?limit=100`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.data.logs);
      }
    } catch (error) {
      console.error("Failed to load audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-slate-600 mt-1">Track admin actions and data changes</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Vaqt</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Actor</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Entity</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Action</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-500">Yuklanmoqda...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-500">Log topilmadi</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(log.createdAt).toLocaleString("uz-UZ")}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {log.actorUsername || log.actorId || "system"}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">
                      {log.entityType} / {log.entityId.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 max-w-md truncate">
                      {log.metadata ? JSON.stringify(log.metadata) : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
