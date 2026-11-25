"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  TrendingUp,
  Activity,
  FileText,
  Phone,
  Mail,
  Globe,
  Plus,
  Edit,
  Pencil,
  Lock,
  ChevronDown,
  Trash2,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  DollarSign,
  Calendar,
  CheckCircle,
  Briefcase,
  MapPin,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatCurrency } from "@/lib/utils";

export default function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const { addToast } = useToast();

  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "contacts" | "opportunities" | "activities" | "notes">("overview");

  // Salesforce Lightning Inline Editing State
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [openSections, setOpenSections] = useState({
    info: true,
    contact: true,
    notes: true,
  });

  const toggleSection = (sec: "info" | "contact" | "notes") => {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const [editForm, setEditForm] = useState({
    name: "",
    buyerType: "INDIVIDUAL",
    industry: "Real Estate",
    annualRevenue: "",
    employees: "",
    ownership: "Private",
    status: "ACTIVE",
    rating: "WARM",
    email: "",
    mobile: "",
    website: "",
    billingStreet: "",
    billingCity: "Dubai",
    billingState: "Dubai",
    billingCountry: "UAE",
    description: "",
  });

  const populateEditForm = (data: any) => {
    setEditForm({
      name: data.name || data.companyName || "",
      buyerType: data.buyerType || "INDIVIDUAL",
      industry: data.industry || "Real Estate",
      annualRevenue: data.annualRevenue ? data.annualRevenue.toString() : "",
      employees: data.employees ? data.employees.toString() : "",
      ownership: data.ownership || "Private",
      status: data.status || "ACTIVE",
      rating: data.rating || "WARM",
      email: data.email || "",
      mobile: data.mobile || "",
      website: data.website || "",
      billingStreet: data.billingStreet || data.addressLine1 || "",
      billingCity: data.billingCity || data.city || "Dubai",
      billingState: data.billingState || "Dubai",
      billingCountry: data.billingCountry || data.country || "UAE",
      description: data.description || "",
    });
  };

  const handleStartInlineEdit = () => {
    if (account) populateEditForm(account);
    setIsInlineEditing(true);
  };

  const handleCancelInlineEdit = () => {
    if (account) populateEditForm(account);
    setIsInlineEditing(false);
  };

  const handleSaveInlineEdit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          companyName: editForm.name,
          buyerType: editForm.buyerType,
          industry: editForm.industry,
          annualRevenue: editForm.annualRevenue ? Number(editForm.annualRevenue) : null,
          employees: editForm.employees ? parseInt(editForm.employees, 10) : null,
          ownership: editForm.ownership,
          status: editForm.status,
          rating: editForm.rating,
          email: editForm.email || null,
          mobile: editForm.mobile,
          website: editForm.website || null,
          billingStreet: editForm.billingStreet || null,
          billingCity: editForm.billingCity || null,
          billingState: editForm.billingState || null,
          billingCountry: editForm.billingCountry || null,
          description: editForm.description || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast("success", "Account updated successfully");
        setIsInlineEditing(false);
        fetchAccount();
      } else {
        addToast("error", data.error || "Failed to update account");
      }
    } catch {
      addToast("error", "Error saving account");
    } finally {
      setSavingEdit(false);
    }
  };

  // Add Contact modal
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactForm, setContactForm] = useState({
    firstName: "",
    lastName: "",
    title: "",
    email: "",
    phone: "",
    department: "",
  });

  // Add Opp modal
  const [showAddOpp, setShowAddOpp] = useState(false);
  const [oppForm, setOppForm] = useState({
    name: "",
    stage: "PROSPECTING",
    amount: "2500000",
    closeDate: "",
    probability: "50",
  });

  // Add Note modal
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteContent, setNoteContent] = useState("");

  const fetchAccount = async () => {
    try {
      const res = await fetch(`/api/accounts/${id}`);
      const data = await res.json();
      if (res.ok) {
        setAccount(data.account);
        populateEditForm(data.account);
      } else {
        addToast("error", data.error || "Account not found");
      }
    } catch {
      addToast("error", "Error loading account details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccount();
  }, [id]);

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...contactForm, accountId: id }),
      });
      if (res.ok) {
        addToast("success", "Contact created");
        setShowAddContact(false);
        setContactForm({ firstName: "", lastName: "", title: "", email: "", phone: "", department: "" });
        fetchAccount();
      } else {
        const err = await res.json();
        addToast("error", err.error || "Failed to create contact");
      }
    } catch {
      addToast("error", "Error creating contact");
    }
  };

  const handleCreateOpp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: oppForm.name,
          buyerId: id,
          stage: oppForm.stage,
          estimatedValue: Number(oppForm.amount),
          budget: Number(oppForm.amount),
          probability: Number(oppForm.probability),
          expectedClosingDate: oppForm.closeDate || null,
        }),
      });
      if (res.ok) {
        addToast("success", "Opportunity created");
        setShowAddOpp(false);
        setOppForm({ name: "", stage: "PROSPECTING", amount: "2500000", closeDate: "", probability: "50" });
        fetchAccount();
      } else {
        const err = await res.json();
        addToast("error", err.error || "Failed to create opportunity");
      }
    } catch {
      addToast("error", "Error creating opportunity");
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "NOTE",
          subject: "Account Note Added",
          description: noteContent,
          buyerId: id,
        }),
      });
      if (res.ok) {
        addToast("success", "Note saved to activity timeline");
        setNoteContent("");
        setShowAddNote(false);
        fetchAccount();
      }
    } catch {
      addToast("error", "Failed to save note");
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm(`Are you sure you want to delete ${account?.name || "this account"}?`)) return;
    try {
      const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
      if (res.ok) {
        addToast("success", "Account deleted");
        router.push("/accounts");
      } else {
        const err = await res.json();
        addToast("error", err.error || "Failed to delete account");
      }
    } catch {
      addToast("error", "Failed to delete account");
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400">
        Loading Account 360° View...
      </div>
    );
  }

  if (!account) {
    return (
      <div className="py-24 text-center">
        <p className="text-slate-600 mb-4">Account not found.</p>
        <Link href="/accounts" className="text-blue-600 font-semibold hover:underline">
          Return to Accounts
        </Link>
      </div>
    );
  }

  const accountName = account.name || account.companyName || "Unnamed Account";
  const metrics = account.metrics || {
    totalContacts: account.contacts?.length || 0,
    totalOpps: account.opportunities?.length || 0,
    openOpps: account.opportunities?.filter((o: any) => !["CLOSED_WON", "CLOSED_LOST"].includes(o.stage)).length || 0,
    wonOpps: account.opportunities?.filter((o: any) => o.stage === "CLOSED_WON").length || 0,
    pipelineValue: account.opportunities?.reduce((s: number, o: any) => s + (o.estimatedValue || 0), 0) || 0,
  };

  return (
    <div className={`space-y-6 ${isInlineEditing ? "pb-24" : ""}`}>
      {/* Back button & Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/accounts" className="hover:text-blue-600 flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Accounts
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold">{accountName}</span>
      </div>

      {/* Account 360 Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold text-xl shrink-0">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {accountName}
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                  {account.accountNumber}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  {account.buyerType}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 flex-wrap">
                {account.industry && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    {account.industry}
                  </span>
                )}
                {account.website && (
                  <a
                    href={account.website.startsWith("http") ? account.website : `https://${account.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    {account.website}
                  </a>
                )}
                {account.mobile && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {account.mobile}
                  </span>
                )}
                {account.relationshipManager && (
                  <span className="flex items-center gap-1">
                    Owner: <span className="font-semibold text-slate-800">{account.relationshipManager.firstName} {account.relationshipManager.lastName}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                if (isInlineEditing) {
                  handleCancelInlineEdit();
                } else {
                  handleStartInlineEdit();
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-colors shadow-2xs ${
                isInlineEditing
                  ? "bg-blue-50 border-blue-300 text-blue-700 shadow-xs"
                  : "bg-white border border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}
            >
              <Pencil className="w-3.5 h-3.5 text-blue-600" />
              {isInlineEditing ? "Discard Changes" : "Edit Account"}
            </button>
            <button
              onClick={() => setShowAddContact(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-semibold transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              + Contact
            </button>
            <button
              onClick={() => setShowAddOpp(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              + Opportunity
            </button>
            <button
              onClick={handleDeleteAccount}
              className="p-1.5 border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Account"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 360° KPI Metric Summary Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-200">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Total Contacts
            </span>
            <span className="text-xl font-bold text-slate-900 mt-0.5 block">
              {metrics.totalContacts}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Total Opportunities
            </span>
            <span className="text-xl font-bold text-slate-900 mt-0.5 block">
              {metrics.totalOpps}
            </span>
          </div>

          <div className="bg-blue-50/60 p-3 rounded-lg border border-blue-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
              Open Opportunities
            </span>
            <span className="text-xl font-bold text-blue-800 mt-0.5 block">
              {metrics.openOpps}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Opportunities Won
            </span>
            <span className="text-xl font-bold text-slate-900 mt-0.5 block">
              {metrics.wonOpps}
            </span>
          </div>

          <div className="bg-blue-50/60 p-3 rounded-lg border border-blue-200 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
              Pipeline Value
            </span>
            <span className="text-xl font-bold text-blue-800 mt-0.5 block">
              {formatCurrency(metrics.pipelineValue)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 flex items-center gap-6">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 text-sm font-semibold transition-colors relative ${
            activeTab === "overview"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("contacts")}
          className={`pb-3 text-sm font-semibold transition-colors relative flex items-center gap-1.5 ${
            activeTab === "contacts"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Contacts
          <span className="px-1.5 py-0.2 rounded-full text-xs bg-slate-100 text-slate-600 font-normal">
            {account.contacts?.length || 0}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("opportunities")}
          className={`pb-3 text-sm font-semibold transition-colors relative flex items-center gap-1.5 ${
            activeTab === "opportunities"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Opportunities
          <span className="px-1.5 py-0.2 rounded-full text-xs bg-blue-50 text-blue-600 font-normal">
            {account.opportunities?.length || 0}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("activities")}
          className={`pb-3 text-sm font-semibold transition-colors relative flex items-center gap-1.5 ${
            activeTab === "activities"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Activity Timeline
        </button>
        <button
          onClick={() => setActiveTab("notes")}
          className={`pb-3 text-sm font-semibold transition-colors relative flex items-center gap-1.5 ${
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
          {/* Section 1: Company Information */}
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
                  Account Information
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
                  {/* Account Owner */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Account Owner
                    </div>
                    <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                          {account.relationshipManager ? account.relationshipManager.firstName[0] : "W"}
                        </div>
                        <span className="font-semibold text-slate-800 text-xs truncate">
                          {account.relationshipManager ? `${account.relationshipManager.firstName} ${account.relationshipManager.lastName}` : "Mohamed Waseem"}
                        </span>
                      </div>
                      <span className="text-slate-300" title="Relationship manager assigned">
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>

                  {/* Account Name */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2 flex items-center gap-1">
                      {isInlineEditing && <span className="text-red-500 font-bold">*</span>}
                      Account Name
                    </div>
                    {isInlineEditing ? (
                      <input
                        type="text"
                        required
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="Company or Entity Name"
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs font-semibold"
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-semibold text-slate-900 text-xs truncate">{accountName}</span>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Account Name"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Buyer Type */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Buyer Category
                    </div>
                    {isInlineEditing ? (
                      <select
                        value={editForm.buyerType}
                        onChange={(e) => setEditForm({ ...editForm, buyerType: e.target.value })}
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      >
                        <option value="INDIVIDUAL">Individual Client</option>
                        <option value="CORPORATE">Corporate Entity</option>
                        <option value="INVESTOR">High-Net-Worth Investor</option>
                        <option value="INSTITUTIONAL">Institutional Fund</option>
                      </select>
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {account.buyerType}
                        </span>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Category"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Industry */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Industry
                    </div>
                    {isInlineEditing ? (
                      <select
                        value={editForm.industry}
                        onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      >
                        <option value="Real Estate">Real Estate</option>
                        <option value="Finance & Investment">Finance & Investment</option>
                        <option value="Technology">Technology</option>
                        <option value="Hospitality & Leisure">Hospitality & Leisure</option>
                        <option value="Consulting & Legal">Consulting & Legal</option>
                        <option value="Retail & Trade">Retail & Trade</option>
                        <option value="Energy & Utilities">Energy & Utilities</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-medium text-slate-800 text-xs truncate">{account.industry || "-"}</span>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Industry"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Ownership */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Ownership
                    </div>
                    {isInlineEditing ? (
                      <select
                        value={editForm.ownership}
                        onChange={(e) => setEditForm({ ...editForm, ownership: e.target.value })}
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      >
                        <option value="Private">Private</option>
                        <option value="Public">Public Listed</option>
                        <option value="Government">Government / Sovereign</option>
                        <option value="Subsidiary">Subsidiary</option>
                      </select>
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-medium text-slate-800 text-xs truncate">{account.ownership || "Private"}</span>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Ownership"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Account Status */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Account Status
                    </div>
                    {isInlineEditing ? (
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="PROSPECT">Prospect</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {account.status || "ACTIVE"}
                        </span>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Status"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-1 md:pl-4">
                  {/* Annual Revenue */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Annual Revenue (AED)
                    </div>
                    {isInlineEditing ? (
                      <input
                        type="number"
                        value={editForm.annualRevenue}
                        onChange={(e) => setEditForm({ ...editForm, annualRevenue: e.target.value })}
                        placeholder="e.g. 50000000"
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs font-semibold"
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-bold text-blue-600 text-xs truncate">
                          {account.annualRevenue ? formatCurrency(account.annualRevenue) : "-"}
                        </span>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Revenue"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Employees */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Employees
                    </div>
                    {isInlineEditing ? (
                      <input
                        type="number"
                        value={editForm.employees}
                        onChange={(e) => setEditForm({ ...editForm, employees: e.target.value })}
                        placeholder="e.g. 250"
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-medium text-slate-800 text-xs truncate">{account.employees || "-"}</span>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Employees"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Account Rating
                    </div>
                    {isInlineEditing ? (
                      <select
                        value={editForm.rating}
                        onChange={(e) => setEditForm({ ...editForm, rating: e.target.value })}
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      >
                        <option value="HOT">Hot</option>
                        <option value="WARM">Warm</option>
                        <option value="COLD">Cold</option>
                      </select>
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-semibold text-blue-600 text-xs">{account.rating || "WARM"}</span>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Rating"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Account Reference (Read-only) */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Account Ref
                    </div>
                    <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                      <span className="font-mono text-slate-700 text-xs">{account.accountNumber}</span>
                      <span className="text-slate-300" title="System calculated">
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>

                  {/* Created On (Read-only) */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Created Date
                    </div>
                    <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                      <span className="text-slate-700 text-xs">{formatDate(account.createdAt)}</span>
                      <span className="text-slate-300" title="System timestamp">
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Contact & Address Details */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            {/* Collapsible Section Header */}
            <button
              type="button"
              onClick={() => toggleSection("contact")}
              className="w-full px-5 py-3.5 bg-slate-50/80 hover:bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                {openSections.contact ? (
                  <ChevronDown className="w-4 h-4 text-slate-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                )}
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Contact & Billing Details
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-normal">
                Email, phone, website & headquarters address
              </span>
            </button>

            {openSections.contact && (
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 p-2 sm:p-4">
                {/* Left Column */}
                <div className="space-y-1 md:pr-4">
                  {/* Primary Email */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Primary Email
                    </div>
                    {isInlineEditing ? (
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        placeholder="info@company.com"
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        {account.email ? (
                          <a href={`mailto:${account.email}`} className="font-semibold text-blue-600 text-xs hover:underline truncate">
                            {account.email}
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

                  {/* Primary Mobile */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Primary Phone
                    </div>
                    {isInlineEditing ? (
                      <input
                        type="tel"
                        value={editForm.mobile}
                        onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                        placeholder="+971 4 000 0000"
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-medium text-slate-800 text-xs truncate">{account.mobile || "-"}</span>
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

                  {/* Website */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Website
                    </div>
                    {isInlineEditing ? (
                      <input
                        type="url"
                        value={editForm.website}
                        onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                        placeholder="https://company.ae"
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        {account.website ? (
                          <a
                            href={account.website.startsWith("http") ? account.website : `https://${account.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-blue-600 text-xs hover:underline truncate"
                          >
                            {account.website}
                          </a>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Website"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-1 md:pl-4">
                  {/* Billing Street */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Billing Street
                    </div>
                    {isInlineEditing ? (
                      <input
                        type="text"
                        value={editForm.billingStreet}
                        onChange={(e) => setEditForm({ ...editForm, billingStreet: e.target.value })}
                        placeholder="Street or Tower Address"
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-medium text-slate-800 text-xs truncate">
                          {account.billingStreet || account.addressLine1 || "Not specified"}
                        </span>
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

                  {/* Billing City */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      City
                    </div>
                    {isInlineEditing ? (
                      <input
                        type="text"
                        value={editForm.billingCity}
                        onChange={(e) => setEditForm({ ...editForm, billingCity: e.target.value })}
                        placeholder="Dubai"
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-medium text-slate-800 text-xs truncate">{account.billingCity || account.city || "Dubai"}</span>
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

                  {/* Billing State & Country */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Emirate / Country
                    </div>
                    {isInlineEditing ? (
                      <div className="flex-1 flex items-center gap-1.5">
                        <input
                          type="text"
                          value={editForm.billingState}
                          onChange={(e) => setEditForm({ ...editForm, billingState: e.target.value })}
                          placeholder="Dubai"
                          className="w-1/2 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                        />
                        <input
                          type="text"
                          value={editForm.billingCountry}
                          onChange={(e) => setEditForm({ ...editForm, billingCountry: e.target.value })}
                          placeholder="UAE"
                          className="w-1/2 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                        />
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-medium text-slate-800 text-xs truncate">
                          {account.billingState || "Dubai"}, {account.billingCountry || "UAE"}
                        </span>
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

          {/* Section 3: Description & Organization Notes */}
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
                  Description & Organization Notes
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-normal">
                Company profile, corporate governance & strategic focus
              </span>
            </button>

            {openSections.notes && (
              <div className="p-4 group">
                {isInlineEditing ? (
                  <textarea
                    rows={4}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Document organization background, parent entities, investment mandate or portfolio details..."
                    className="w-full p-3 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 leading-relaxed shadow-xs"
                  />
                ) : (
                  <div className="relative">
                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-100 whitespace-pre-line">
                      {account.description || "No specific organization notes logged."}
                    </p>
                    <button
                      type="button"
                      onClick={handleStartInlineEdit}
                      className="absolute top-2 right-2 p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                      title="Edit Description"
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

      {/* Tab 2: Contacts */}
      {activeTab === "contacts" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Associated Contacts</h3>
              <p className="text-xs text-slate-500">People working at or associated with {accountName}</p>
            </div>
            <button
              onClick={() => setShowAddContact(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Contact
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-4">Contact Name</th>
                  <th className="py-2.5 px-4">Title / Role</th>
                  <th className="py-2.5 px-4">Department</th>
                  <th className="py-2.5 px-4">Email</th>
                  <th className="py-2.5 px-4">Phone</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {!account.contacts || account.contacts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No contacts associated with this account yet. Click &quot;+ Add Contact&quot; above.
                    </td>
                  </tr>
                ) : (
                  account.contacts.map((c: any) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4">
                        <Link href={`/contacts/${c.id}`} className="font-semibold text-blue-600 hover:underline">
                          {c.salutation ? `${c.salutation} ` : ""}{c.firstName} {c.lastName}
                        </Link>
                        <span className="block text-[10px] text-slate-400 font-mono">{c.contactNumber}</span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">{c.title || "-"}</td>
                      <td className="py-2.5 px-4 text-slate-600">{c.department || "-"}</td>
                      <td className="py-2.5 px-4 text-slate-600">{c.email || "-"}</td>
                      <td className="py-2.5 px-4 text-slate-600">{c.phone || c.mobile || "-"}</td>
                      <td className="py-2.5 px-4 text-right">
                        <Link
                          href={`/contacts/${c.id}`}
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

      {/* Tab 3: Opportunities */}
      {activeTab === "opportunities" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Opportunities Pipeline</h3>
              <p className="text-xs text-slate-500">Deals and transactions in progress for {accountName}</p>
            </div>
            <button
              onClick={() => setShowAddOpp(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Opportunity
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-4">Opportunity</th>
                  <th className="py-2.5 px-4">Stage</th>
                  <th className="py-2.5 px-4">Amount</th>
                  <th className="py-2.5 px-4">Probability</th>
                  <th className="py-2.5 px-4">Expected Close</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {!account.opportunities || account.opportunities.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No opportunities logged for this account.
                    </td>
                  </tr>
                ) : (
                  account.opportunities.map((opp: any) => (
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
                      <td className="py-2.5 px-4 text-slate-600">{formatDate(opp.closeDate || opp.expectedClosingDate)}</td>
                      <td className="py-2.5 px-4 text-right">
                        <Link
                          href={`/opportunities/${opp.id}`}
                          className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded font-semibold text-[11px]"
                        >
                          View Deal
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

      {/* Tab 4: Activity Timeline */}
      {activeTab === "activities" && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Activity Timeline</h3>
            <button
              onClick={() => setShowAddNote(true)}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold"
            >
              + Log Activity / Note
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {!account.activities || account.activities.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No recorded activity history yet.</p>
            ) : (
              account.activities.map((act: any) => (
                <div key={act.id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 text-xs">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-800">{act.subject}</p>
                      <span className="text-slate-400 text-[10px]">{formatDate(act.createdAt)}</span>
                    </div>
                    {act.description && (
                      <p className="text-slate-600 mt-1">{act.description}</p>
                    )}
                    <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                      Logged by {act.createdBy ? `${act.createdBy.firstName} ${act.createdBy.lastName}` : "System"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Notes */}
      {activeTab === "notes" && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Account Notes</h3>
            <button
              onClick={() => setShowAddNote(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
            >
              + Add Note
            </button>
          </div>

          <form onSubmit={handleAddNote} className="space-y-3">
            <textarea
              rows={3}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Type meeting notes, executive summaries, strategic requirements..."
              className="w-full p-3 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-600"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!noteContent.trim()}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
              >
                Save Note
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Add Contact */}
      {showAddContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Contact to {accountName}</h3>
              <button onClick={() => setShowAddContact(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <form onSubmit={handleCreateContact} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={contactForm.firstName}
                    onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={contactForm.lastName}
                    onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Job Title</label>
                <input
                  type="text"
                  value={contactForm.title}
                  onChange={(e) => setContactForm({ ...contactForm, title: e.target.value })}
                  placeholder="e.g. Chief Executive Officer"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddContact(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Opportunity */}
      {showAddOpp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Opportunity for {accountName}</h3>
              <button onClick={() => setShowAddOpp(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <form onSubmit={handleCreateOpp} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Opportunity Name *</label>
                <input
                  type="text"
                  required
                  value={oppForm.name}
                  onChange={(e) => setOppForm({ ...oppForm, name: e.target.value })}
                  placeholder="e.g. Luxury Penthouse Acquisition"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stage</label>
                  <select
                    value={oppForm.stage}
                    onChange={(e) => setOppForm({ ...oppForm, stage: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="PROSPECTING">Prospecting</option>
                    <option value="QUALIFICATION">Qualification</option>
                    <option value="NEEDS_ANALYSIS">Needs Analysis</option>
                    <option value="PROPOSAL">Proposal</option>
                    <option value="NEGOTIATION">Negotiation</option>
                    <option value="CLOSED_WON">Closed Won</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount (AED)</label>
                  <input
                    type="number"
                    value={oppForm.amount}
                    onChange={(e) => setOppForm({ ...oppForm, amount: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Win Probability (%)</label>
                  <input
                    type="number"
                    value={oppForm.probability}
                    onChange={(e) => setOppForm({ ...oppForm, probability: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Close Date</label>
                  <input
                    type="date"
                    value={oppForm.closeDate}
                    onChange={(e) => setOppForm({ ...oppForm, closeDate: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddOpp(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  Save Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Salesforce Lightning Sticky Action Bar */}
      {isInlineEditing && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3.5 px-6 shadow-2xl flex items-center justify-center gap-4 transition-all">
          <div className="text-xs text-slate-500 hidden sm:flex items-center gap-2 mr-4">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            Unsaved changes in Account record
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

