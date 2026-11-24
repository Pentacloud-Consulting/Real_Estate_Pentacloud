"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Globe,
  Phone,
  Users,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatCurrency } from "@/lib/utils";

interface AccountItem {
  id: string;
  accountNumber: string;
  name: string | null;
  companyName: string | null;
  buyerType: string;
  industry: string | null;
  website: string | null;
  mobile: string | null;
  annualRevenue: number | null;
  employees: number | null;
  status: string;
  rating: string | null;
  createdAt: string;
  contactsCount: number;
  oppsCount: number;
  relationshipManager?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export default function AccountsPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    buyerType: "CORPORATE",
    industry: "Real Estate",
    website: "",
    mobile: "",
    email: "",
    annualRevenue: "",
    employees: "",
    companySize: "51-200",
    ownership: "Private",
    status: "ACTIVE",
    rating: "WARM",
    description: "",
    billingStreet: "",
    billingCity: "Dubai",
    billingState: "Dubai",
    billingCountry: "UAE",
    billingPostalCode: "",
  });

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
      });
      if (search) params.set("search", search);
      if (industryFilter) params.set("industry", industryFilter);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/accounts?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setAccounts(data.accounts || []);
        setTotal(data.total || 0);
      } else {
        addToast("error", data.error || "Failed to load accounts");
      }
    } catch {
      addToast("error", "Network error while loading accounts");
    } finally {
      setLoading(false);
    }
  }, [page, search, industryFilter, statusFilter, addToast]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleOpenCreate = () => {
    setFormData({
      name: "",
      buyerType: "CORPORATE",
      industry: "Real Estate",
      website: "",
      mobile: "",
      email: "",
      annualRevenue: "",
      employees: "",
      companySize: "51-200",
      ownership: "Private",
      status: "ACTIVE",
      rating: "WARM",
      description: "",
      billingStreet: "",
      billingCity: "Dubai",
      billingState: "Dubai",
      billingCountry: "UAE",
      billingPostalCode: "",
    });
    setShowCreateModal(true);
  };

  const handleOpenEdit = (acc: AccountItem) => {
    setSelectedAccount(acc);
    setFormData({
      name: acc.name || acc.companyName || "",
      buyerType: acc.buyerType || "CORPORATE",
      industry: acc.industry || "Real Estate",
      website: acc.website || "",
      mobile: acc.mobile || "",
      email: "",
      annualRevenue: acc.annualRevenue ? acc.annualRevenue.toString() : "",
      employees: acc.employees ? acc.employees.toString() : "",
      companySize: "51-200",
      ownership: "Private",
      status: acc.status || "ACTIVE",
      rating: acc.rating || "WARM",
      description: "",
      billingStreet: "",
      billingCity: "Dubai",
      billingState: "Dubai",
      billingCountry: "UAE",
      billingPostalCode: "",
    });
    setShowEditModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast("error", "Account Name is required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        addToast("success", "Account created successfully");
        setShowCreateModal(false);
        fetchAccounts();
      } else {
        addToast("error", data.error || "Failed to create account");
      }
    } catch {
      addToast("error", "Failed to create account");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/accounts/${selectedAccount.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        addToast("success", "Account updated successfully");
        setShowEditModal(false);
        fetchAccounts();
      } else {
        addToast("error", data.error || "Failed to update account");
      }
    } catch {
      addToast("error", "Failed to update account");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete account "${name}"?`)) return;
    try {
      const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
      if (res.ok) {
        addToast("success", "Account deleted");
        fetchAccounts();
      } else {
        const data = await res.json();
        addToast("error", data.error || "Failed to delete account");
      }
    } catch {
      addToast("error", "Failed to delete account");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            Accounts
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage corporate client accounts, companies, and 360° relationship records
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            New Account
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search accounts by name, company, email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 bg-white"
            />
          </div>

          <select
            value={industryFilter}
            onChange={(e) => {
              setIndustryFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 bg-white text-slate-700"
          >
            <option value="">All Industries</option>
            <option value="Real Estate">Real Estate</option>
            <option value="Technology">Technology</option>
            <option value="Finance & Investment">Finance & Investment</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Hospitality">Hospitality</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 bg-white text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PROSPECT">Prospect</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-semibold text-slate-800">{accounts.length}</span> of{" "}
          <span className="font-semibold text-slate-800">{total}</span> accounts
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Account Name</th>
                <th className="py-3 px-4">Industry</th>
                <th className="py-3 px-4">Website</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Revenue</th>
                <th className="py-3 px-4">Contacts</th>
                <th className="py-3 px-4">Opportunities</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Loading accounts...
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No accounts found. Click &quot;New Account&quot; to create one.
                  </td>
                </tr>
              ) : (
                accounts.map((acc) => {
                  const accountDisplayName =
                    acc.name || acc.companyName || "Unnamed Account";
                  return (
                    <tr
                      key={acc.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <Link
                          href={`/accounts/${acc.id}`}
                          className="font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1.5"
                        >
                          <Building2 className="w-4 h-4 text-blue-600" />
                          {accountDisplayName}
                        </Link>
                        <span className="text-xs text-slate-400 block font-mono">
                          {acc.accountNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {acc.industry || "-"}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {acc.website ? (
                          <a
                            href={acc.website.startsWith("http") ? acc.website : `https://${acc.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1 text-xs"
                          >
                            <Globe className="w-3.5 h-3.5" />
                            {acc.website.replace(/^https?:\/\//, "")}
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {acc.mobile ? (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {acc.mobile}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {acc.annualRevenue ? formatCurrency(acc.annualRevenue) : "-"}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs border border-slate-200">
                          {acc.contactsCount} Contacts
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs border border-blue-200 font-semibold">
                          {acc.oppsCount} Opps
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${
                            acc.status === "ACTIVE"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {acc.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/accounts/${acc.id}`}
                            className="p-1.5 rounded-md hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors"
                            title="View Account 360"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleOpenEdit(acc)}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                            title="Edit Account"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(acc.id, accountDisplayName)}
                            className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                            title="Delete Account"
                          >
                            <Trash2 className="w-4 h-4" />
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
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div>
              Page {page} of {Math.ceil(total / 15)}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page >= Math.ceil(total / 15)}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Account Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-in fade-in">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                {showCreateModal ? "Create New Account" : "Edit Account"}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={showCreateModal ? handleCreateSubmit : handleEditSubmit}
              className="p-6 space-y-5"
            >
              {/* Basic Information */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Account Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Account Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Emaar Properties PJSC"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Industry
                    </label>
                    <select
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 bg-white"
                    >
                      <option value="Real Estate">Real Estate</option>
                      <option value="Technology">Technology</option>
                      <option value="Finance & Investment">Finance & Investment</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Hospitality">Hospitality</option>
                      <option value="Construction">Construction</option>
                      <option value="Consulting">Consulting</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Account Type
                    </label>
                    <select
                      value={formData.buyerType}
                      onChange={(e) => setFormData({ ...formData, buyerType: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 bg-white"
                    >
                      <option value="CORPORATE">Corporate</option>
                      <option value="INDIVIDUAL">Individual Client</option>
                      <option value="PROSPECT">Prospect</option>
                      <option value="PARTNER">Partner</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Website
                    </label>
                    <input
                      type="text"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="e.g. www.emaar.com"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      placeholder="e.g. +971 4 367 3333"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Annual Revenue (AED)
                    </label>
                    <input
                      type="number"
                      value={formData.annualRevenue}
                      onChange={(e) => setFormData({ ...formData, annualRevenue: e.target.value })}
                      placeholder="e.g. 15000000"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Employees Count
                    </label>
                    <input
                      type="number"
                      value={formData.employees}
                      onChange={(e) => setFormData({ ...formData, employees: e.target.value })}
                      placeholder="e.g. 250"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Account Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 bg-white"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="PROSPECT">Prospect</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Rating
                    </label>
                    <select
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 bg-white"
                    >
                      <option value="HOT">Hot</option>
                      <option value="WARM">Warm</option>
                      <option value="COLD">Cold</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Billing Address
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={formData.billingStreet}
                      onChange={(e) => setFormData({ ...formData, billingStreet: e.target.value })}
                      placeholder="e.g. Downtown Boulevard, Tower 1"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.billingCity}
                      onChange={(e) => setFormData({ ...formData, billingCity: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Country</label>
                    <input
                      type="text"
                      value={formData.billingCountry}
                      onChange={(e) => setFormData({ ...formData, billingCountry: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {submitting ? "Saving..." : showCreateModal ? "Create Account" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

