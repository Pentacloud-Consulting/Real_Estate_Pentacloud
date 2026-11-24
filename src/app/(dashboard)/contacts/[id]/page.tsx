"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Building2,
  TrendingUp,
  Activity,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  ArrowLeft,
  Edit,
  Pencil,
  Lock,
  ChevronDown,
  ChevronRight,
  Trash2,
  Plus,
  MessageSquare,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatCurrency } from "@/lib/utils";

export default function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const { addToast } = useToast();

  const [contact, setContact] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "opportunities" | "activities" | "notes">("overview");

  // Accounts list for association dropdown
  const [accounts, setAccounts] = useState<any[]>([]);

  // Salesforce Lightning Inline Editing State
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [openSections, setOpenSections] = useState({
    info: true,
    address: true,
    notes: true,
  });

  const toggleSection = (sec: "info" | "address" | "notes") => {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const [editForm, setEditForm] = useState({
    salutation: "Mr.",
    firstName: "",
    lastName: "",
    title: "",
    department: "",
    accountId: "",
    email: "",
    phone: "",
    mobile: "",
    whatsapp: "",
    leadSource: "WEBSITE",
    mailingStreet: "",
    mailingCity: "Dubai",
    mailingState: "Dubai",
    mailingCountry: "UAE",
    description: "",
  });

  const populateEditForm = (data: any) => {
    setEditForm({
      salutation: data.salutation || "Mr.",
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      title: data.title || "",
      department: data.department || "",
      accountId: data.accountId || data.account?.id || "",
      email: data.email || "",
      phone: data.phone || "",
      mobile: data.mobile || "",
      whatsapp: data.whatsapp || "",
      leadSource: data.leadSource || "WEBSITE",
      mailingStreet: data.mailingStreet || "",
      mailingCity: data.mailingCity || "Dubai",
      mailingState: data.mailingState || "Dubai",
      mailingCountry: data.mailingCountry || "UAE",
      description: data.description || "",
    });
  };

  const handleStartInlineEdit = () => {
    if (contact) populateEditForm(contact);
    setIsInlineEditing(true);
  };

  const handleCancelInlineEdit = () => {
    if (contact) populateEditForm(contact);
    setIsInlineEditing(false);
  };

  const handleSaveInlineEdit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/contacts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salutation: editForm.salutation,
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          title: editForm.title || null,
          department: editForm.department || null,
          accountId: editForm.accountId || null,
          email: editForm.email || null,
          phone: editForm.phone || null,
          mobile: editForm.mobile || null,
          whatsapp: editForm.whatsapp || null,
          leadSource: editForm.leadSource,
          mailingStreet: editForm.mailingStreet || null,
          mailingCity: editForm.mailingCity || null,
          mailingState: editForm.mailingState || null,
          mailingCountry: editForm.mailingCountry || null,
          description: editForm.description || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast("success", "Contact updated successfully");
        setIsInlineEditing(false);
        fetchContact();
      } else {
        addToast("error", data.error || "Failed to update contact");
      }
    } catch {
      addToast("error", "Error saving contact");
    } finally {
      setSavingEdit(false);
    }
  };

  // Note form
  const [noteContent, setNoteContent] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const fetchContact = async () => {
    try {
      const res = await fetch(`/api/contacts/${id}`);
      const data = await res.json();
      if (res.ok) {
        setContact(data.contact);
        populateEditForm(data.contact);
      } else {
        addToast("error", data.error || "Contact not found");
      }
    } catch {
      addToast("error", "Error loading contact details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContact();
    fetch("/api/accounts?limit=100")
      .then((r) => r.json())
      .then((d) => setAccounts(d.accounts || []))
      .catch(() => {});
  }, [id]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "NOTE",
          subject: "Contact Note Added",
          description: noteContent,
          contactId: id,
          buyerId: contact.accountId || undefined,
        }),
      });
      if (res.ok) {
        addToast("success", "Note saved");
        setNoteContent("");
        fetchContact();
      } else {
        addToast("error", "Failed to save note");
      }
    } catch {
      addToast("error", "Failed to save note");
    } finally {
      setSavingNote(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${contact.firstName} ${contact.lastName}?`)) return;
    try {
      const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
      if (res.ok) {
        addToast("success", "Contact deleted");
        router.push("/contacts");
      } else {
        const err = await res.json();
        addToast("error", err.error || "Failed to delete contact");
      }
    } catch {
      addToast("error", "Failed to delete contact");
    }
  };

  if (loading) {
    return <div className="py-24 text-center text-slate-400">Loading Contact Record...</div>;
  }

  if (!contact) {
    return (
      <div className="py-24 text-center">
        <p className="text-slate-600 mb-4">Contact record not found.</p>
        <Link href="/contacts" className="text-blue-600 font-semibold hover:underline">
          Return to Contacts
        </Link>
      </div>
    );
  }

  const fullName = `${contact.salutation ? contact.salutation + " " : ""}${contact.firstName} ${contact.lastName}`;

  return (
    <div className={`space-y-6 ${isInlineEditing ? "pb-24" : ""}`}>
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/contacts" className="hover:text-blue-600 flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Contacts
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold">{fullName}</span>
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold text-xl shrink-0">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {fullName}
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                  {contact.contactNumber}
                </span>
                {contact.title && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                    {contact.title}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 flex-wrap">
                {contact.account && (
                  <Link
                    href={`/accounts/${contact.account.id}`}
                    className="flex items-center gap-1 text-blue-600 hover:underline font-semibold"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    {contact.account.name || contact.account.companyName}
                  </Link>
                )}
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-slate-600 hover:text-blue-600">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {contact.email}
                  </a>
                )}
                {(contact.phone || contact.mobile) && (
                  <span className="flex items-center gap-1 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {contact.phone || contact.mobile}
                  </span>
                )}
                {contact.owner && (
                  <span className="text-slate-500">
                    Owner: <strong className="text-slate-800">{contact.owner.firstName} {contact.owner.lastName}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (isInlineEditing) {
                  handleCancelInlineEdit();
                } else {
                  handleStartInlineEdit();
                }
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 border rounded-lg text-xs font-semibold transition-colors shadow-2xs ${
                isInlineEditing
                  ? "bg-blue-50 border-blue-300 text-blue-700 shadow-xs"
                  : "bg-white border border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}
            >
              <Pencil className="w-3.5 h-3.5 text-blue-600" />
              {isInlineEditing ? "Discard Changes" : "Edit Contact"}
            </button>
            <button
              onClick={handleDelete}
              className="p-2 border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Contact"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-6">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 text-sm font-semibold transition-colors ${
            activeTab === "overview"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("opportunities")}
          className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-1.5 ${
            activeTab === "opportunities"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Opportunities
          <span className="px-1.5 py-0.2 rounded-full text-xs bg-blue-50 text-blue-600 font-normal">
            {contact.opportunities?.length || 0}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("activities")}
          className={`pb-3 text-sm font-semibold transition-colors ${
            activeTab === "activities"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Activity Timeline
        </button>
        <button
          onClick={() => setActiveTab("notes")}
          className={`pb-3 text-sm font-semibold transition-colors ${
            activeTab === "notes"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Notes
        </button>
      </div>

      {/* Tab 1: Overview — Salesforce Lightning Inline Editable Layout */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Section 1: Contact Information */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            {/* Collapsible Section Header */}
            <button
              type="button"
              onClick={() => toggleSection("info")}
              className="w-full px-5 py-3.5 bg-slate-50/80 hover:bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                {openSections.info ? (
                  <ChevronDown className="w-4 h-4 text-slate-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                )}
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Contact Information
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-normal">
                {isInlineEditing ? "Direct inline editing enabled" : "Click pencil icon to edit in place"}
              </span>
            </button>

            {openSections.info && (
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 p-2 sm:p-4">
                {/* Left Column */}
                <div className="space-y-1 md:pr-4">
                  {/* Contact Owner */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Contact Owner
                    </div>
                    <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                          {contact.owner ? contact.owner.firstName[0] : "A"}
                        </div>
                        <span className="font-semibold text-slate-800 text-xs truncate">
                          {contact.owner ? `${contact.owner.firstName} ${contact.owner.lastName}` : "Ahmed Al Rashid"}
                        </span>
                      </div>
                      <span className="text-slate-300" title="System assigned owner">
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>

                  {/* Name (Salutation, First Name, Last Name) */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2 flex items-center gap-1">
                      {isInlineEditing && <span className="text-red-500 font-bold">*</span>}
                      Name
                    </div>
                    {isInlineEditing ? (
                      <div className="flex-1 flex items-center gap-1.5">
                        <select
                          value={editForm.salutation}
                          onChange={(e) => setEditForm({ ...editForm, salutation: e.target.value })}
                          className="w-20 px-2 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                        >
                          <option value="Mr.">Mr.</option>
                          <option value="Ms.">Ms.</option>
                          <option value="Mrs.">Mrs.</option>
                          <option value="Dr.">Dr.</option>
                          <option value="H.E.">H.E.</option>
                        </select>
                        <input
                          type="text"
                          required
                          value={editForm.firstName}
                          onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                          placeholder="First Name"
                          className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                        />
                        <input
                          type="text"
                          required
                          value={editForm.lastName}
                          onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                          placeholder="Last Name"
                          className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                        />
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-semibold text-slate-900 text-xs truncate">
                          {fullName}
                        </span>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Name"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Associated Account */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Account Name
                    </div>
                    {isInlineEditing ? (
                      <select
                        value={editForm.accountId}
                        onChange={(e) => setEditForm({ ...editForm, accountId: e.target.value })}
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      >
                        <option value="">-- Independent / No Account --</option>
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name || acc.companyName || `${acc.firstName || ""} ${acc.lastName || ""}`.trim() || acc.accountNumber}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        {contact.account ? (
                          <Link href={`/accounts/${contact.account.id}`} className="font-semibold text-blue-600 text-xs hover:underline truncate">
                            {contact.account.name || contact.account.companyName}
                          </Link>
                        ) : (
                          <span className="text-slate-400 text-xs">Independent</span>
                        )}
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Account"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Job Title */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Job Title
                    </div>
                    {isInlineEditing ? (
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        placeholder="e.g. Chief Executive Officer"
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-medium text-slate-800 text-xs truncate">{contact.title || "-"}</span>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Job Title"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Department */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Department
                    </div>
                    {isInlineEditing ? (
                      <input
                        type="text"
                        value={editForm.department}
                        onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                        placeholder="e.g. Executive Office, Acquisitions"
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-medium text-slate-800 text-xs truncate">{contact.department || "-"}</span>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Department"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-1 md:pl-4">
                  {/* Email */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Email
                    </div>
                    {isInlineEditing ? (
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        placeholder="contact@example.com"
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        {contact.email ? (
                          <a href={`mailto:${contact.email}`} className="font-semibold text-blue-600 text-xs hover:underline truncate">
                            {contact.email}
                          </a>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Email"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Mobile Phone */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Mobile Phone
                    </div>
                    {isInlineEditing ? (
                      <input
                        type="tel"
                        value={editForm.mobile}
                        onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                        placeholder="+971 50 000 0000"
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-medium text-slate-800 text-xs truncate">{contact.mobile || "-"}</span>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Mobile"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Direct Phone */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Direct Phone
                    </div>
                    {isInlineEditing ? (
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        placeholder="+971 4 000 0000"
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-medium text-slate-800 text-xs truncate">{contact.phone || "-"}</span>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Phone"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* WhatsApp */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      WhatsApp
                    </div>
                    {isInlineEditing ? (
                      <input
                        type="tel"
                        value={editForm.whatsapp}
                        onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })}
                        placeholder="+971 50 000 0000"
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-medium text-slate-800 text-xs truncate">{contact.whatsapp || "-"}</span>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit WhatsApp"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Lead Source */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Lead Source
                    </div>
                    {isInlineEditing ? (
                      <select
                        value={editForm.leadSource}
                        onChange={(e) => setEditForm({ ...editForm, leadSource: e.target.value })}
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      >
                        <option value="WEBSITE">Website</option>
                        <option value="REFERRAL">Referral</option>
                        <option value="BROKER">Broker</option>
                        <option value="CAMPAIGN">Campaign</option>
                        <option value="DIRECT">Direct Contact</option>
                      </select>
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-semibold text-blue-600 text-xs truncate">{contact.leadSource || "WEBSITE"}</span>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Source"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Contact Reference (Read-only) */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Contact Ref
                    </div>
                    <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                      <span className="font-mono text-slate-700 text-xs">{contact.contactNumber}</span>
                      <span className="text-slate-300" title="System calculated">
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>

                  {/* Created Date (Read-only) */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Created Date
                    </div>
                    <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                      <span className="text-slate-700 text-xs">{formatDate(contact.createdAt)}</span>
                      <span className="text-slate-300" title="System timestamp">
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Mailing & Address Information */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            {/* Collapsible Section Header */}
            <button
              type="button"
              onClick={() => toggleSection("address")}
              className="w-full px-5 py-3.5 bg-slate-50/80 hover:bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                {openSections.address ? (
                  <ChevronDown className="w-4 h-4 text-slate-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                )}
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Address Information
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-normal">
                Mailing street, city, emirate & country
              </span>
            </button>

            {openSections.address && (
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 p-2 sm:p-4">
                {/* Left Column */}
                <div className="space-y-1 md:pr-4">
                  {/* Mailing Street */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Mailing Street
                    </div>
                    {isInlineEditing ? (
                      <input
                        type="text"
                        value={editForm.mailingStreet}
                        onChange={(e) => setEditForm({ ...editForm, mailingStreet: e.target.value })}
                        placeholder="Street address or P.O. Box"
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-medium text-slate-800 text-xs truncate">{contact.mailingStreet || "-"}</span>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Street"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Mailing City */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Mailing City
                    </div>
                    {isInlineEditing ? (
                      <input
                        type="text"
                        value={editForm.mailingCity}
                        onChange={(e) => setEditForm({ ...editForm, mailingCity: e.target.value })}
                        placeholder="Dubai"
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-medium text-slate-800 text-xs truncate">{contact.mailingCity || "Dubai"}</span>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit City"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-1 md:pl-4">
                  {/* Mailing State */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      State / Emirate
                    </div>
                    {isInlineEditing ? (
                      <input
                        type="text"
                        value={editForm.mailingState}
                        onChange={(e) => setEditForm({ ...editForm, mailingState: e.target.value })}
                        placeholder="Dubai"
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-medium text-slate-800 text-xs truncate">{contact.mailingState || "Dubai"}</span>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit State"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Mailing Country */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Country
                    </div>
                    {isInlineEditing ? (
                      <input
                        type="text"
                        value={editForm.mailingCountry}
                        onChange={(e) => setEditForm({ ...editForm, mailingCountry: e.target.value })}
                        placeholder="United Arab Emirates"
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-medium text-slate-800 text-xs truncate">{contact.mailingCountry || "UAE"}</span>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Country"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Description & Relationship Notes */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            {/* Collapsible Section Header */}
            <button
              type="button"
              onClick={() => toggleSection("notes")}
              className="w-full px-5 py-3.5 bg-slate-50/80 hover:bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                {openSections.notes ? (
                  <ChevronDown className="w-4 h-4 text-slate-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                )}
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Description & Relationship Notes
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-normal">
                Communication logs, background & decision rights
              </span>
            </button>

            {openSections.notes && (
              <div className="p-4 group">
                {isInlineEditing ? (
                  <textarea
                    rows={4}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Document contact background, authority level, preferences or discussion history..."
                    className="w-full p-3 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 leading-relaxed shadow-xs"
                  />
                ) : (
                  <div className="relative">
                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-100 whitespace-pre-line">
                      {contact.description || "No specific contact notes logged."}
                    </p>
                    <button
                      type="button"
                      onClick={handleStartInlineEdit}
                      className="absolute top-2 right-2 p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                      title="Edit Notes"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Opportunities */}
      {activeTab === "opportunities" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Associated Opportunities</h3>
            <p className="text-xs text-slate-500">Deals where {fullName} is designated contact</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-4">Opportunity</th>
                  <th className="py-2.5 px-4">Stage</th>
                  <th className="py-2.5 px-4">Amount</th>
                  <th className="py-2.5 px-4">Probability</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {!contact.opportunities || contact.opportunities.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No opportunities directly linked to this contact.
                    </td>
                  </tr>
                ) : (
                  contact.opportunities.map((opp: any) => (
                    <tr key={opp.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4">
                        <Link href={`/opportunities/${opp.id}`} className="font-semibold text-blue-600 hover:underline">
                          {opp.name}
                        </Link>
                        <span className="block text-[10px] text-slate-400 font-mono">{opp.opportunityNumber}</span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {opp.stage}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">
                        {formatCurrency(opp.amount || opp.estimatedValue || 0)}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">{opp.probability || 50}%</td>
                      <td className="py-2.5 px-4 text-right">
                        <Link
                          href={`/opportunities/${opp.id}`}
                          className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded font-semibold text-[11px]"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Activity Timeline */}
      {activeTab === "activities" && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Activity History</h3>
          <div className="space-y-3 pt-2">
            {!contact.activities || contact.activities.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No recorded activity history yet.</p>
            ) : (
              contact.activities.map((act: any) => (
                <div key={act.id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 text-xs">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-800">{act.subject}</p>
                      <span className="text-slate-400 text-[10px]">{formatDate(act.createdAt)}</span>
                    </div>
                    {act.description && <p className="text-slate-600 mt-1">{act.description}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {activeTab === "notes" && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Contact Notes</h3>
          <form onSubmit={handleAddNote} className="space-y-3">
            <textarea
              rows={3}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Add contact notes, communication logs, client preferences..."
              className="w-full p-3 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-600"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!noteContent.trim() || savingNote}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
              >
                {savingNote ? "Saving..." : "Save Note"}
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Salesforce Lightning Sticky Action Bar */}
      {isInlineEditing && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3.5 px-6 shadow-2xl flex items-center justify-center gap-4 transition-all">
          <div className="text-xs text-slate-500 hidden sm:flex items-center gap-2 mr-4">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            Unsaved changes in Contact record
          </div>
          <button
            type="button"
            onClick={handleCancelInlineEdit}
            disabled={savingEdit}
            className="px-6 py-2 border border-slate-300 rounded-full font-semibold text-xs text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSaveInlineEdit()}
            disabled={savingEdit}
            className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-xs shadow-md transition-colors flex items-center gap-2"
          >
            {savingEdit ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>
      )}
    </div>
  );
}

