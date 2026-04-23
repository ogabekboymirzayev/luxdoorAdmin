"use client";

import { useState, useEffect } from "react";
import { Phone, Filter } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Lead {
  id: string;
  name: string;
  phone: string;
  message: string;
  status: "NEW" | "CONTACTED" | "NEGOTIATION" | "WON" | "LOST" | "NOT_CALLED" | "CALLED";
  source?: string;
  notes?: string | null;
  nextFollowUpAt?: string | null;
  createdAt: string;
}

const STATUS_OPTIONS: Array<Lead["status"]> = [
  "NEW",
  "CONTACTED",
  "NEGOTIATION",
  "WON",
  "LOST",
  "NOT_CALLED",
  "CALLED",
];

const STATUS_LABELS: Record<Lead["status"], string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
  NOT_CALLED: "Not Called",
  CALLED: "Called",
};

const STATUS_BADGE: Record<Lead["status"], string> = {
  NEW: "bg-blue-100 text-blue-800",
  CONTACTED: "bg-indigo-100 text-indigo-800",
  NEGOTIATION: "bg-amber-100 text-amber-800",
  WON: "bg-green-100 text-green-800",
  LOST: "bg-rose-100 text-rose-800",
  NOT_CALLED: "bg-yellow-100 text-yellow-800",
  CALLED: "bg-emerald-100 text-emerald-800",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"ALL" | Lead["status"]>("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/leads?limit=100`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setLeads(data.data.leads);
    } catch (err) {
      console.error("Failed to fetch leads:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLead = async (lead: Lead) => {
    const nextFollowUpAt = lead.nextFollowUpAt || null;

    try {
      setUpdatingId(lead.id);
      const res = await fetch(`${API_URL}/api/leads/${lead.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: lead.status,
          notes: lead.notes || "",
          nextFollowUpAt,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLeads((prev) => prev.map((l) => l.id === lead.id ? data.data : l));
      }
    } catch (err) {
      console.error("Failed to update lead:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const patchLocalLead = (id: string, patch: Partial<Lead>) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const filteredLeads = leads.filter((lead) => {
    if (statusFilter === "ALL") return true;
    return lead.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Leads</h1>
        <p className="text-slate-600 mt-1">Manage customer inquiries</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-slate-600 text-sm font-medium">Total Leads</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">{loading ? "..." : leads.length}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-slate-600 text-sm font-medium">Open</p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">{loading ? "..." : leads.filter((l) => !["WON", "LOST", "CALLED"].includes(l.status)).length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-slate-600 text-sm font-medium">Closed</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{loading ? "..." : leads.filter((l) => ["WON", "LOST", "CALLED"].includes(l.status)).length}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={18} className="text-slate-600" />
          <span className="font-semibold text-slate-900">Filter by Status</span>
        </div>
        <div className="flex gap-2">
          {[
            { label: "All", value: "ALL" as const },
            { label: "New", value: "NEW" as const },
            { label: "Negotiation", value: "NEGOTIATION" as const },
            { label: "Won", value: "WON" as const },
            { label: "Lost", value: "LOST" as const },
          ].map((btn) => (
            <button
              key={btn.value}
              onClick={() => setStatusFilter(btn.value)}
              className={`px-4 py-2 rounded-lg transition font-medium text-sm ${
                statusFilter === btn.value
                  ? "bg-gradient-to-r from-primary to-accent text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Ism</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Telefon</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Xabar</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Izoh</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Next Follow-up</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Sana</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-6 py-4">
                      <div className="h-6 bg-slate-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">{lead.name}</td>
                  <td className="px-6 py-4 text-sm">
                    <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-blue-600 hover:text-blue-900 font-medium">
                      <Phone size={16} />
                      {lead.phone}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">{lead.message}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[lead.status]}`}>
                      {STATUS_LABELS[lead.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <input
                      value={lead.notes || ""}
                      onChange={(e) => patchLocalLead(lead.id, { notes: e.target.value })}
                      placeholder="Qisqa izoh"
                      className="border border-slate-200 rounded px-2 py-1 w-48"
                    />
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <input
                      type="datetime-local"
                      value={lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toISOString().slice(0, 16) : ""}
                      onChange={(e) => patchLocalLead(lead.id, { nextFollowUpAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
                      className="border border-slate-200 rounded px-2 py-1"
                    />
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(lead.createdAt).toLocaleDateString("uz-UZ")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <select
                        value={lead.status}
                        onChange={(e) => patchLocalLead(lead.id, { status: e.target.value as Lead["status"] })}
                        className="border border-slate-200 rounded px-2 py-1 text-sm"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleUpdateLead(lead)}
                        disabled={updatingId === lead.id}
                        className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition font-medium text-sm disabled:opacity-50"
                      >
                        Save
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && filteredLeads.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-600">Lead topilmadi</p>
          </div>
        )}
      </div>
    </div>
  );
}
