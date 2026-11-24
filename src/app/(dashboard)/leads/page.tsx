"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  Search,
  Eye,
  Trash2,
  Edit,
  Phone,
  Mail,
  Building2,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  ArrowRightCircle,
  ExternalLink,
  Flame,
  ArrowRight,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatCurrency } from "@/lib/utils";

interface LeadItem {
  id: string;
  leadNumber: string;
  firstName: string;
  lastName: string;
  company?: string | null;
  title?: string | null;
  email: string | null;
  mobile: string;
  source: string;
  status: string;
  rating?: string | null;
  temperature?: string;
  industry?: string | null;
  budgetMax?: number | null;
  isConverted: boolean;
  createdAt: string;
  assignedAdvisor?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  broker?: {
    id: string;
    name: string;
  } | null;
}

export default function LeadsPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Saved Views
  const [view, setView] = useState<"all" | "my" | "new" | "working" | "qualified" | "converted">("all");
  const [search, setSearch] = useState("");

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    salutation: "Mr.",
    title: "",
    company: "",
    email: "",
    mobile: "",
    whatsapp: "",
    website: "",
    industry: "Real Estate",
    annualRevenue: "",
    employees: "",
    street: "",
    city: "Dubai",
    country: "UAE",
    postalCode: "",
    source: "WEBSITE",
    rating: "WARM",
    status: "NEW",
    requirement: "",
    budgetMax: "2800000",
    propertyType: "APARTMENT",
    qualificationNotes: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Form State
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    salutation: "Mr.",
    title: "",
    company: "",
    email: "",
    mobile: "",
    whatsapp: "",
    website: "",
    industry: "Real Estate",
    annualRevenue: "",
    employees: "",
    street: "",
    city: "Dubai",
    country: "UAE",
    postalCode: "",
    source: "WEBSITE",
    rating: "WARM",
    status: "NEW",
    requirement: "",
    budgetMax: "2800000",
    qualificationNotes: "",
  });

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        view,
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/leads?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setLeads(data.leads || []);
        setTotal(data.total || 0);
      } else {
        addToast("error", data.error || "Failed to load leads");
      }
    } catch {
      addToast("error", "Error loading leads");
    } finally {
      setLoading(false);
    }
  }, [page, view, search, addToast]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName) {
      addToast("error", "First Name and Last Name are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          annualRevenue: form.annualRevenue ? Number(form.annualRevenue) : undefined,
          employees: form.employees ? Number(form.employees) : undefined,
          budgetMax: form.budgetMax ? Number(form.budgetMax) : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast("success", "Lead created successfully");
        setShowCreateModal(false);
        fetchLeads();
      } else {
        addToast("error", data.error || "Failed to create lead");
      }
    } catch {
      addToast("error", "Failed to create lead");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = async (leadItem: LeadItem) => {
    try {
      const res = await fetch(`/api/leads/${leadItem.id}`);
      const data = await res.json();
      const l = data.lead || leadItem;
      setEditingLead(l);
      setEditForm({
        firstName: l.firstName || "",
        lastName: l.lastName || "",
        salutation: l.salutation || "Mr.",
        title: l.title || "",
        company: l.company || "",
        email: l.email || "",
        mobile: l.mobile || "",
        whatsapp: l.whatsapp || "",
        website: l.website || "",
        industry: l.industry || "Real Estate",
        annualRevenue: l.annualRevenue ? l.annualRevenue.toString() : "",
        employees: l.employees ? l.employees.toString() : "",
        street: l.street || "",
        city: l.city || "Dubai",
        country: l.country || "UAE",
        postalCode: l.postalCode || "",
        source: l.source || "WEBSITE",
        rating: l.rating || l.temperature || "WARM",
        status: l.status || "NEW",
        requirement: l.requirement || "",
        budgetMax: l.budgetMax ? l.budgetMax.toString() : "2800000",
        propertyType: l.propertyType || "APARTMENT",
        qualificationNotes: l.qualificationNotes || "",
      });
      setShowEditModal(true);
    } catch {
      addToast("error", "Failed to load lead details for editing");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/leads/${editingLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          salutation: editForm.salutation,
          title: editForm.title,
          company: editForm.company,
          email: editForm.email || null,
          mobile: editForm.mobile,
          whatsapp: editForm.whatsapp || null,
          website: editForm.website || null,
          industry: editForm.industry,
          annualRevenue: editForm.annualRevenue ? Number(editForm.annualRevenue) : null,
          employees: editForm.employees ? parseInt(editForm.employees) : null,
          street: editForm.street || null,
          city: editForm.city || null,
          country: editForm.country || null,
          postalCode: editForm.postalCode || null,
          source: editForm.source,
          rating: editForm.rating,
          status: editForm.status,
          requirement: editForm.requirement || null,
          budgetMax: editForm.budgetMax ? Number(editForm.budgetMax) : null,
          propertyType: editForm.propertyType,
          qualificationNotes: editForm.qualificationNotes || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast("success", "Lead updated successfully");
        setShowEditModal(false);
        fetchLeads();
      } else {
        addToast("error", data.error || "Failed to update lead");
      }
    } catch {
      addToast("error", "Error saving lead edits");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete lead "${name}"?`)) return;
    try {
      const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
      if (res.ok) {
        addToast("success", "Lead deleted");
        fetchLeads();
      } else {
        const d = await res.json();
        addToast("error", d.error || "Failed to delete lead");
      }
    } catch {
      addToast("error", "Failed to delete lead");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Leads
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage incoming prospects, qualify opportunities, and convert to Contacts & Accounts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            New Lead
          </button>
        </div>
      </div>

      {/* Saved Views Tabs & Search */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Saved List Views Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All Leads" },
            { id: "my", label: "My Leads" },
            { id: "new", label: "New Leads" },
            { id: "working", label: "Working" },
            { id: "qualified", label: "Qualified" },
            { id: "converted", label: "Converted" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setView(tab.id as any);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                view === tab.id
                  ? "bg-blue-50 text-blue-600 border border-blue-200"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px] flex-1 sm:flex-initial">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-600 bg-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Lead Name</th>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Loading leads...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No leads found in this view.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const fullName = `${lead.firstName} ${lead.lastName}`;
                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3 px-4">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1.5"
                        >
                          <Users className="w-3.5 h-3.5 text-blue-600" />
                          {fullName}
                        </Link>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {lead.leadNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {lead.company || "Individual"}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {lead.email ? (
                          <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {lead.email}
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {lead.mobile}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {lead.source}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            lead.isConverted
                              ? "bg-slate-100 text-slate-700 border-slate-300"
                              : lead.status === "QUALIFIED"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-slate-50 text-slate-700 border-slate-200"
                          }`}
                        >
                          {lead.isConverted ? "CONVERTED" : lead.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-700">
                          {lead.rating || lead.temperature || "WARM"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {lead.assignedAdvisor ? `${lead.assignedAdvisor.firstName} ${lead.assignedAdvisor.lastName}` : "Unassigned"}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {formatDate(lead.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/leads/${lead.id}`}
                            className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold transition-colors flex items-center gap-1 text-[11px]"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </Link>
                          <button
                            onClick={() => handleOpenEdit(lead)}
                            className="px-2 py-1 rounded bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold transition-colors flex items-center gap-1 text-[11px] shadow-2xs"
                          >
                            <Edit className="w-3.5 h-3.5 text-slate-500" />
                            Edit
                          </button>
                          {!lead.isConverted && (
                            <Link
                              href={`/leads/${lead.id}?action=convert`}
                              className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors flex items-center gap-1 text-[11px]"
                            >
                              Convert
                            </Link>
                          )}
                          <button
                            onClick={() => handleDelete(lead.id, fullName)}
                            className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 15 && (
          <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div>
              Page {page} of {Math.ceil(total / 15)}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page >= Math.ceil(total / 15)}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Comprehensive Salesforce Lead Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Create New Lead
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-6 text-xs">
              {/* A. Basic Information */}
              <div>
                <h3 className="font-bold uppercase tracking-wider text-slate-400 mb-3 pb-1 border-b border-slate-100">
                  A. Basic Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Salutation</label>
                    <select
                      value={form.salutation}
                      onChange={(e) => setForm({ ...form, salutation: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="Mr.">Mr.</option>
                      <option value="Ms.">Ms.</option>
                      <option value="Mrs.">Mrs.</option>
                      <option value="Dr.">Dr.</option>
                      <option value="Sheikh">Sheikh</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Job Title</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g. Managing Director"
                      className="w-full p-2 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Company Name *</label>
                    <input
                      type="text"
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      placeholder="Company / Entity"
                      className="w-full p-2 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Lead Rating</label>
                    <select
                      value={form.rating}
                      onChange={(e) => setForm({ ...form, rating: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="HOT">Hot</option>
                      <option value="WARM">Warm</option>
                      <option value="COLD">Cold</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* B. Contact Information */}
              <div>
                <h3 className="font-bold uppercase tracking-wider text-slate-400 mb-3 pb-1 border-b border-slate-100">
                  B. Contact Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mobile Phone *</label>
                    <input
                      type="text"
                      required
                      value={form.mobile}
                      onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">WhatsApp</label>
                    <input
                      type="text"
                      value={form.whatsapp}
                      onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Website</label>
                    <input
                      type="text"
                      value={form.website}
                      onChange={(e) => setForm({ ...form, website: e.target.value })}
                      placeholder="e.g. www.company.com"
                      className="w-full p-2 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* C. Company & Address */}
              <div>
                <h3 className="font-bold uppercase tracking-wider text-slate-400 mb-3 pb-1 border-b border-slate-100">
                  C. Company & Address Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Industry</label>
                    <select
                      value={form.industry}
                      onChange={(e) => setForm({ ...form, industry: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="Real Estate">Real Estate</option>
                      <option value="Technology">Technology</option>
                      <option value="Finance & Investment">Finance & Investment</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Hospitality">Hospitality</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Annual Revenue (AED)</label>
                    <input
                      type="number"
                      value={form.annualRevenue}
                      onChange={(e) => setForm({ ...form, annualRevenue: e.target.value })}
                      placeholder="e.g. 5000000"
                      className="w-full p-2 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Lead Source</label>
                    <select
                      value={form.source}
                      onChange={(e) => setForm({ ...form, source: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="WEBSITE">Website Direct</option>
                      <option value="CAMPAIGN">Marketing Campaign</option>
                      <option value="REFERRAL">Referral</option>
                      <option value="BROKER">Broker Partner</option>
                      <option value="EXHIBITION">Exhibition / Event</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">City / Country</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Street Address</label>
                    <input
                      type="text"
                      value={form.street}
                      onChange={(e) => setForm({ ...form, street: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* D. Qualification */}
              <div>
                <h3 className="font-bold uppercase tracking-wider text-slate-400 mb-3 pb-1 border-b border-slate-100">
                  D. Qualification & Requirements
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Estimated Budget (AED)</label>
                    <input
                      type="number"
                      value={form.budgetMax}
                      onChange={(e) => setForm({ ...form, budgetMax: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Lead Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="NEW">New</option>
                      <option value="CONTACTED">Contacted</option>
                      <option value="QUALIFIED">Qualified</option>
                      <option value="LOST">Unqualified / Lost</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Qualification Notes</label>
                    <textarea
                      rows={2}
                      value={form.qualificationNotes}
                      onChange={(e) => setForm({ ...form, qualificationNotes: e.target.value })}
                      placeholder="Requirements, challenges, purchasing timeline, decision maker status..."
                      className="w-full p-2 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  {submitting ? "Saving Lead..." : "Save Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Lead Modal (Strict 2-Column Left & Right Layout) */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Edit className="w-4 h-4 text-blue-600" />
                  Edit Lead: {editingLead?.leadNumber}
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Update contact, company, qualification and requirement specifications
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 rounded-md hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-6 text-xs">
              {/* Section 1: Basic Information */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    1. Basic Information
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium">Name & Corporate Profile</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      First Name <span className="text-blue-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Last Name <span className="text-blue-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Salutation</label>
                    <select
                      value={editForm.salutation}
                      onChange={(e) => setEditForm({ ...editForm, salutation: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="Mr.">Mr.</option>
                      <option value="Ms.">Ms.</option>
                      <option value="Mrs.">Mrs.</option>
                      <option value="Dr.">Dr.</option>
                      <option value="Sheikh">Sheikh</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Job Title</label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      placeholder="e.g. Managing Director"
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Company Name</label>
                    <input
                      type="text"
                      value={editForm.company}
                      onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                      placeholder="Company / Entity"
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Lead Rating</label>
                    <select
                      value={editForm.rating}
                      onChange={(e) => setEditForm({ ...editForm, rating: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="HOT">Hot</option>
                      <option value="WARM">Warm</option>
                      <option value="COLD">Cold</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Contact Information */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    2. Contact Information
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium">Communication Channels</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Mobile Phone <span className="text-blue-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.mobile}
                      onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">WhatsApp</label>
                    <input
                      type="text"
                      value={editForm.whatsapp}
                      onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Website</label>
                    <input
                      type="text"
                      value={editForm.website}
                      onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                      placeholder="e.g. www.company.com"
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Company & Address */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    3. Company & Address
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium">Business Context & Location</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Industry</label>
                    <select
                      value={editForm.industry}
                      onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="Real Estate">Real Estate</option>
                      <option value="Technology">Technology</option>
                      <option value="Finance & Investment">Finance & Investment</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Hospitality">Hospitality</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Annual Revenue (AED)</label>
                    <input
                      type="number"
                      value={editForm.annualRevenue}
                      onChange={(e) => setEditForm({ ...editForm, annualRevenue: e.target.value })}
                      placeholder="e.g. 5000000"
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Lead Source</label>
                    <select
                      value={editForm.source}
                      onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="WEBSITE">Website Direct</option>
                      <option value="CAMPAIGN">Marketing Campaign</option>
                      <option value="REFERRAL">Referral</option>
                      <option value="BROKER">Broker Partner</option>
                      <option value="EXHIBITION">Exhibition / Event</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">City / Country</label>
                    <input
                      type="text"
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Street Address</label>
                    <input
                      type="text"
                      value={editForm.street}
                      onChange={(e) => setEditForm({ ...editForm, street: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Qualification & Requirements */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    4. Qualification & Status
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium">Buying Intent & Pipeline State</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Estimated Budget (AED)</label>
                    <input
                      type="number"
                      value={editForm.budgetMax}
                      onChange={(e) => setEditForm({ ...editForm, budgetMax: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Lead Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="NEW">New</option>
                      <option value="CONTACTED">Contacted</option>
                      <option value="QUALIFIED">Qualified</option>
                      <option value="LOST">Unqualified / Lost</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Qualification Notes</label>
                    <textarea
                      rows={2}
                      value={editForm.qualificationNotes}
                      onChange={(e) => setEditForm({ ...editForm, qualificationNotes: e.target.value })}
                      placeholder="Requirements, purchasing timeline, decision maker status..."
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs disabled:opacity-50 transition-colors"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
