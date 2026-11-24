"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  Building2,
  Briefcase,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";

interface ContactItem {
  id: string;
  contactNumber: string;
  firstName: string;
  lastName: string;
  salutation?: string | null;
  title?: string | null;
  department?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  whatsapp?: string | null;
  createdAt: string;
  account?: {
    id: string;
    accountNumber: string;
    name: string | null;
    companyName: string | null;
  } | null;
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export default function ContactsPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [accountsList, setAccountsList] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    salutation: "Mr.",
    title: "",
    department: "",
    email: "",
    phone: "",
    mobile: "",
    whatsapp: "",
    accountId: "",
    mailingStreet: "",
    mailingCity: "Dubai",
    mailingCountry: "UAE",
    description: "",
  });

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
      });
      if (search) params.set("search", search);
      if (selectedAccountId) params.set("accountId", selectedAccountId);

      const res = await fetch(`/api/contacts?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setContacts(data.contacts || []);
        setTotal(data.total || 0);
      } else {
        addToast("error", data.error || "Failed to load contacts");
      }
    } catch {
      addToast("error", "Network error while loading contacts");
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedAccountId, addToast]);

  useEffect(() => {
    fetchContacts();
    // Load accounts list for dropdown
    fetch("/api/accounts?limit=100")
      .then((res) => res.json())
      .then((d) => setAccountsList(d.accounts || []))
      .catch(() => {});
  }, [fetchContacts]);

  const handleOpenCreate = () => {
    setForm({
      firstName: "",
      lastName: "",
      salutation: "Mr.",
      title: "",
      department: "",
      email: "",
      phone: "",
      mobile: "",
      whatsapp: "",
      accountId: selectedAccountId || "",
      mailingStreet: "",
      mailingCity: "Dubai",
      mailingCountry: "UAE",
      description: "",
    });
    setShowCreateModal(true);
  };

  const handleOpenEdit = (c: ContactItem) => {
    setSelectedContact(c);
    setForm({
      firstName: c.firstName,
      lastName: c.lastName,
      salutation: c.salutation || "Mr.",
      title: c.title || "",
      department: c.department || "",
      email: c.email || "",
      phone: c.phone || "",
      mobile: c.mobile || "",
      whatsapp: c.whatsapp || "",
      accountId: c.account?.id || "",
      mailingStreet: "",
      mailingCity: "Dubai",
      mailingCountry: "UAE",
      description: "",
    });
    setShowEditModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName) {
      addToast("error", "First name and Last name are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        addToast("success", "Contact created");
        setShowCreateModal(false);
        fetchContacts();
      } else {
        addToast("error", data.error || "Failed to create contact");
      }
    } catch {
      addToast("error", "Failed to create contact");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/contacts/${selectedContact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        addToast("success", "Contact updated");
        setShowEditModal(false);
        fetchContacts();
      } else {
        addToast("error", data.error || "Failed to update contact");
      }
    } catch {
      addToast("error", "Failed to update contact");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete contact "${name}"?`)) return;
    try {
      const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
      if (res.ok) {
        addToast("success", "Contact deleted");
        fetchContacts();
      } else {
        const d = await res.json();
        addToast("error", d.error || "Failed to delete contact");
      }
    } catch {
      addToast("error", "Failed to delete contact");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Contacts
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage individual client contacts, executives, decision makers, and company representatives
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            New Contact
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search contacts by name, email, phone, title..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 bg-white"
            />
          </div>

          <select
            value={selectedAccountId}
            onChange={(e) => {
              setSelectedAccountId(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 bg-white text-slate-700"
          >
            <option value="">All Accounts</option>
            {accountsList.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name || a.companyName || a.accountNumber}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-semibold text-slate-800">{contacts.length}</span> of{" "}
          <span className="font-semibold text-slate-800">{total}</span> contacts
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Contact Name</th>
                <th className="py-3 px-4">Account Name</th>
                <th className="py-3 px-4">Job Title</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone / Mobile</th>
                <th className="py-3 px-4">Contact Owner</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading contacts...
                  </td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No contacts found. Click &quot;New Contact&quot; to create one.
                  </td>
                </tr>
              ) : (
                contacts.map((c) => {
                  const fullName = `${c.salutation ? c.salutation + " " : ""}${c.firstName} ${c.lastName}`.trim();
                  const accountTitle = c.account?.name || c.account?.companyName || "-";

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3 px-4">
                        <Link
                          href={`/contacts/${c.id}`}
                          className="font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1.5"
                        >
                          <Users className="w-4 h-4 text-blue-600" />
                          {fullName}
                        </Link>
                        <span className="text-xs text-slate-400 block font-mono">
                          {c.contactNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {c.account ? (
                          <Link
                            href={`/accounts/${c.account.id}`}
                            className="text-slate-800 hover:text-blue-600 hover:underline flex items-center gap-1 font-medium text-xs"
                          >
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {accountTitle}
                          </Link>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium text-xs">
                        {c.title || "-"}
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {c.email ? (
                          <a href={`mailto:${c.email}`} className="text-blue-600 hover:underline flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" />
                            {c.email}
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {c.phone || c.mobile ? (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {c.phone || c.mobile}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {c.owner ? `${c.owner.firstName} ${c.owner.lastName}` : "Unassigned"}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">
                        {formatDate(c.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/contacts/${c.id}`}
                            className="p-1.5 rounded-md hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors"
                            title="View Contact Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                            title="Edit Contact"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id, fullName)}
                            className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                            title="Delete Contact"
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

      {/* Modal Create/Edit */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                {showCreateModal ? "New Contact" : "Edit Contact"}
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

            <form onSubmit={showCreateModal ? handleCreateSubmit : handleEditSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
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
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Associated Account</label>
                <select
                  value={form.accountId}
                  onChange={(e) => setForm({ ...form, accountId: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="">-- No Account (Independent) --</option>
                  {accountsList.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name || a.companyName || a.accountNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    placeholder="e.g. Investment / Procurement"
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                  <label className="block font-semibold text-slate-700 mb-1">Phone / Mobile</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value, mobile: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  {submitting ? "Saving..." : showCreateModal ? "Create Contact" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

