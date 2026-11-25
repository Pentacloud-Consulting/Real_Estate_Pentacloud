"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users,
  Building2,
  TrendingUp,
  Activity,
  Phone,
  Mail,
  ArrowLeft,
  Edit,
  Pencil,
  Lock,
  ChevronDown,
  ChevronRight,
  Trash2,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Globe,
  Briefcase,
  MapPin,
  Calendar,
  Layers,
  Handshake,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatCurrency } from "@/lib/utils";

export default function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const searchParams = useSearchParams();
  const { addToast } = useToast();

  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "activities" | "notes" | "related">("overview");

  // Conversion Modal State
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [converting, setConverting] = useState(false);
  const [conversionSuccess, setConversionSuccess] = useState<any | null>(null);

  // Conversion Form
  const [existingAccounts, setExistingAccounts] = useState<any[]>([]);
  const [existingContacts, setExistingContacts] = useState<any[]>([]);
  const [brokersList, setBrokersList] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);

  // Edit Lead State (Inline & Modal)
  const [showEditModal, setShowEditModal] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
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
    street: "",
    city: "Dubai",
    source: "WEBSITE",
    rating: "WARM",
    status: "NEW",
    budgetMax: "2800000",
    qualificationNotes: "",
    brokerId: "",
    interestedProjectId: "",
    propertyType: "APARTMENT",
  });

  const handleOpenEdit = () => {
    if (!lead) return;
    populateEditForm(lead);
    setShowEditModal(true);
  };

  // Salesforce Lightning Inline Editing State
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [openSections, setOpenSections] = useState({
    info: true,
    property: true,
    notes: true,
  });

  const toggleSection = (sec: "info" | "property" | "notes") => {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const populateEditForm = (data: any) => {
    setEditForm({
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      salutation: data.salutation || "Mr.",
      title: data.title || "",
      company: data.company || "",
      email: data.email || "",
      mobile: data.mobile || "",
      whatsapp: data.whatsapp || "",
      website: data.website || "",
      industry: data.industry || "Real Estate",
      annualRevenue: data.annualRevenue ? data.annualRevenue.toString() : "",
      street: data.street || "",
      city: data.city || "Dubai",
      source: data.source || "WEBSITE",
      rating: data.rating || data.temperature || "WARM",
      status: data.status || "NEW",
      budgetMax: data.budgetMax ? data.budgetMax.toString() : "2800000",
      qualificationNotes: data.qualificationNotes || "",
      brokerId: data.brokerId || data.broker?.id || "",
      interestedProjectId: data.interestedProjectId || data.project?.id || "",
      propertyType: data.propertyType || "APARTMENT",
    });
  };

  const handleStartInlineEdit = () => {
    if (lead) populateEditForm(lead);
    setIsInlineEditing(true);
  };

  const handleCancelInlineEdit = () => {
    if (lead) populateEditForm(lead);
    setIsInlineEditing(false);
  };

  const handleSaveInlineEdit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/leads/${id}`, {
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
          street: editForm.street || null,
          city: editForm.city || null,
          source: editForm.source,
          rating: editForm.rating,
          status: editForm.status,
          budgetMax: editForm.budgetMax ? Number(editForm.budgetMax) : null,
          qualificationNotes: editForm.qualificationNotes || null,
          brokerId: editForm.brokerId || null,
          interestedProjectId: editForm.interestedProjectId || null,
          propertyType: editForm.propertyType || "APARTMENT",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast("success", "Lead record saved successfully");
        setIsInlineEditing(false);
        setShowEditModal(false);
        fetchLead();
      } else {
        addToast("error", data.error || "Failed to update lead");
      }
    } catch {
      addToast("error", "Error saving lead");
    } finally {
      setSavingEdit(false);
    }
  };

  const [convertForm, setConvertForm] = useState({
    accountOption: "create" as "create" | "existing",
    accountId: "",
    accountName: "",
    contactOption: "create" as "create" | "existing",
    contactId: "",
    opportunityOption: "create" as "create" | "skip",
    opportunityName: "",
    opportunityAmount: "2500000",
    opportunityCloseDate: "",
    opportunityStage: "PROSPECTING",
    brokerId: "",
    scheduledVisitDate: "",
    paymentMethod: "",
    paymentPlan: "",
    conversionNotes: "",
  });

  // Note State
  const [noteContent, setNoteContent] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const fetchLead = async () => {
    try {
      const res = await fetch(`/api/leads/${id}`);
      const data = await res.json();
      if (res.ok) {
        setLead(data.lead);
        populateEditForm(data.lead);
        // Pre-fill conversion form
        setConvertForm((prev) => ({
          ...prev,
          accountName: data.lead.company || `${data.lead.firstName} ${data.lead.lastName}`,
          opportunityName: `${data.lead.company || data.lead.firstName + ' ' + data.lead.lastName} - Acquisition Deal`,
          opportunityAmount: data.lead.budgetMax?.toString() || "2500000",
          brokerId: data.lead.brokerId || "",
        }));
      } else {
        addToast("error", data.error || "Lead not found");
      }
    } catch {
      addToast("error", "Error loading lead details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLead();
    // Load accounts and brokers for conversion
    fetch("/api/accounts?limit=100")
      .then((r) => r.json())
      .then((d) => setExistingAccounts(d.accounts || []))
      .catch(() => {});
    fetch("/api/contacts?limit=100")
      .then((r) => r.json())
      .then((d) => setExistingContacts(d.contacts || []))
      .catch(() => {});
    fetch("/api/brokers")
      .then((r) => r.json())
      .then((d) => setBrokersList(d.brokers || []))
      .catch(() => {});
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => setProjectsList(d.projects || []))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (searchParams.get("action") === "convert") {
      setShowConvertModal(true);
    }
  }, [searchParams]);

  const handleConvertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConverting(true);
    try {
      const res = await fetch(`/api/leads/${id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...convertForm,
          leadData: lead,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast("success", "Lead successfully converted!");
        setConversionSuccess(data);
        fetchLead();
      } else {
        addToast("error", data.error || "Failed to convert lead");
      }
    } catch {
      addToast("error", "Error converting lead");
    } finally {
      setConverting(false);
    }
  };

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
          subject: "Lead Note Added",
          description: noteContent,
          leadId: id,
        }),
      });
      if (res.ok) {
        addToast("success", "Note saved to timeline");
        setNoteContent("");
        fetchLead();
      } else {
        addToast("error", "Failed to save note");
      }
    } catch {
      addToast("error", "Error saving note");
    } finally {
      setSavingNote(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete lead ${lead.firstName} ${lead.lastName}?`)) return;
    try {
      const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
      if (res.ok) {
        addToast("success", "Lead deleted");
        router.push("/leads");
      } else {
        addToast("error", "Failed to delete lead");
      }
    } catch {
      addToast("error", "Error deleting lead");
    }
  };

  if (loading) {
    return <div className="py-24 text-center text-slate-400">Loading Lead Record...</div>;
  }

  if (!lead) {
    return (
      <div className="py-24 text-center">
        <p className="text-slate-600 mb-4">Lead not found.</p>
        <Link href="/leads" className="text-blue-600 font-semibold hover:underline">
          Return to Leads
        </Link>
      </div>
    );
  }

  const fullName = `${lead.firstName} ${lead.lastName}`;

  return (
    <div className={`space-y-6 ${isInlineEditing ? "pb-24" : ""}`}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/leads" className="hover:text-blue-600 flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Leads
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
                  {lead.leadNumber}
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${
                    lead.isConverted
                      ? "bg-slate-100 text-slate-700 border-slate-300"
                      : lead.status === "QUALIFIED"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-slate-50 text-slate-700 border-slate-200"
                  }`}
                >
                  {lead.isConverted ? "CONVERTED" : lead.status}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200">
                  {lead.rating || "WARM"}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 flex-wrap">
                {lead.company && (
                  <span className="flex items-center gap-1 text-slate-800 font-semibold">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {lead.company}
                  </span>
                )}
                {lead.email && (
                  <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-slate-600 hover:text-blue-600">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {lead.email}
                  </a>
                )}
                {lead.mobile && (
                  <span className="flex items-center gap-1 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {lead.mobile}
                  </span>
                )}
                {lead.assignedAdvisor && (
                  <span className="text-slate-500">
                    Owner: <strong className="text-slate-800">{lead.assignedAdvisor.firstName} {lead.assignedAdvisor.lastName}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
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
              {isInlineEditing ? "Discard Changes" : "Edit Lead"}
            </button>
            {!lead.isConverted ? (
              <button
                onClick={() => {
                  setConversionSuccess(null);
                  setShowConvertModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                Convert Lead
              </button>
            ) : (
              <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                Converted Record
              </span>
            )}
            <button
              onClick={handleDelete}
              className="p-2 border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Lead"
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
        <button
          onClick={() => setActiveTab("related")}
          className={`pb-3 text-sm font-semibold transition-colors ${
            activeTab === "related"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Converted Records
        </button>
      </div>

      {/* Tab 1: Overview — Salesforce Lightning Inline Editable Layout */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Section 1: Lead Information */}
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
                  Lead Information
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
                  {/* Lead Owner */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Lead Owner
                    </div>
                    <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                          {lead.assignedAdvisor ? lead.assignedAdvisor.firstName[0] : "W"}
                        </div>
                        <span className="font-semibold text-slate-800 text-xs truncate">
                          {lead.assignedAdvisor ? `${lead.assignedAdvisor.firstName} ${lead.assignedAdvisor.lastName}` : "Mohamed Waseem"}
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
                          {lead.salutation ? `${lead.salutation} ` : ""}{fullName}
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

                  {/* Company */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2 flex items-center gap-1">
                      {isInlineEditing && <span className="text-red-500 font-bold">*</span>}
                      Company
                    </div>
                    {isInlineEditing ? (
                      <input
                        type="text"
                        required
                        value={editForm.company}
                        onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                        placeholder="Company or Individual"
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-semibold text-slate-800 text-xs truncate">{lead.company || "Individual"}</span>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Company"
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
                        placeholder="e.g. Managing Director"
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-medium text-slate-800 text-xs truncate">{lead.title || "-"}</span>
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

                  {/* Lead Status */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2 flex items-center gap-1">
                      {isInlineEditing && <span className="text-red-500 font-bold">*</span>}
                      Lead Status
                    </div>
                    {isInlineEditing ? (
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs font-medium"
                      >
                        <option value="NEW">New</option>
                        <option value="WORKING">Working</option>
                        <option value="CONTACTED">Contacted</option>
                        <option value="QUALIFIED">Qualified</option>
                        <option value="UNQUALIFIED">Unqualified</option>
                        <option value="CONVERTED">Converted</option>
                      </select>
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {lead.status}
                        </span>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Lead Status"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Lead Rating */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Lead Rating
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
                        <span className="font-semibold text-slate-800 text-xs">{lead.rating || "WARM"}</span>
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
                        placeholder="client@example.com"
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        {lead.email ? (
                          <a href={`mailto:${lead.email}`} className="font-semibold text-blue-600 text-xs hover:underline truncate">
                            {lead.email}
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
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2 flex items-center gap-1">
                      {isInlineEditing && <span className="text-red-500 font-bold">*</span>}
                      Mobile Phone
                    </div>
                    {isInlineEditing ? (
                      <input
                        type="tel"
                        required
                        value={editForm.mobile}
                        onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                        placeholder="+971 50 000 0000"
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-medium text-slate-800 text-xs truncate">{lead.mobile}</span>
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
                        <span className="font-medium text-slate-800 text-xs truncate">{lead.whatsapp || "-"}</span>
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
                        value={editForm.source}
                        onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      >
                        <option value="WEBSITE">Website Direct</option>
                        <option value="REFERRAL">Referral</option>
                        <option value="BROKER">Broker Channel</option>
                        <option value="CAMPAIGN">Marketing Campaign</option>
                        <option value="DIRECT">Direct Call</option>
                        <option value="COLD_CALL">Outbound Outreach</option>
                      </select>
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-semibold text-blue-600 text-xs truncate">{lead.source}</span>
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
                        <option value="Consulting">Consulting</option>
                        <option value="Retail & Trade">Retail & Trade</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-medium text-slate-800 text-xs truncate">{lead.industry || "-"}</span>
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

                  {/* Lead Reference (Read-only) */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Lead Reference
                    </div>
                    <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                      <span className="font-mono text-slate-700 text-xs">{lead.leadNumber}</span>
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
                      <span className="text-slate-700 text-xs">{formatDate(lead.createdAt)}</span>
                      <span className="text-slate-300" title="System timestamp">
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Requirements & Property Profile */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            {/* Collapsible Section Header */}
            <button
              type="button"
              onClick={() => toggleSection("property")}
              className="w-full px-5 py-3.5 bg-slate-50/80 hover:bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                {openSections.property ? (
                  <ChevronDown className="w-4 h-4 text-slate-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                )}
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Requirements & Property Profile
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-normal">
                Development target, property type & investment budget
              </span>
            </button>

            {openSections.property && (
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 p-2 sm:p-4">
                {/* Left Column */}
                <div className="space-y-1 md:pr-4">
                  {/* Target Development */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Target Project
                    </div>
                    {isInlineEditing ? (
                      <select
                        value={editForm.interestedProjectId}
                        onChange={(e) => setEditForm({ ...editForm, interestedProjectId: e.target.value })}
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      >
                        <option value="">-- General / Azure Marina Residences --</option>
                        {projectsList.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.code})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-semibold text-slate-800 text-xs truncate">
                          {lead.project?.name || lead.interestedProject || "Azure Marina Residences"}
                        </span>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Target Project"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Property Type */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Property Type
                    </div>
                    {isInlineEditing ? (
                      <select
                        value={editForm.propertyType}
                        onChange={(e) => setEditForm({ ...editForm, propertyType: e.target.value })}
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      >
                        <option value="APARTMENT">Apartment</option>
                        <option value="PENTHOUSE">Penthouse</option>
                        <option value="VILLA">Villa</option>
                        <option value="TOWNHOUSE">Townhouse</option>
                        <option value="COMMERCIAL">Commercial Office</option>
                      </select>
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-semibold text-slate-800 text-xs truncate">{lead.propertyType || "APARTMENT"}</span>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Property Type"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Estimated Budget */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Estimated Budget (AED)
                    </div>
                    {isInlineEditing ? (
                      <input
                        type="number"
                        value={editForm.budgetMax}
                        onChange={(e) => setEditForm({ ...editForm, budgetMax: e.target.value })}
                        placeholder="2800000"
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs font-semibold"
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-bold text-blue-600 text-xs truncate">
                          {lead.budgetMax ? formatCurrency(lead.budgetMax) : "-"}
                        </span>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Budget"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-1 md:pl-4">
                  {/* Referring Broker */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Referring Broker
                    </div>
                    {isInlineEditing ? (
                      <select
                        value={editForm.brokerId}
                        onChange={(e) => setEditForm({ ...editForm, brokerId: e.target.value })}
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      >
                        <option value="">-- Direct / None --</option>
                        {brokersList.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}{b.contactPerson && b.contactPerson !== b.name ? ` (${b.contactPerson})` : ""}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-medium text-slate-800 text-xs truncate">
                          {lead.broker ? lead.broker.name : "None assigned"}
                        </span>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Broker"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Street Address */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Street Address
                    </div>
                    {isInlineEditing ? (
                      <input
                        type="text"
                        value={editForm.street}
                        onChange={(e) => setEditForm({ ...editForm, street: e.target.value })}
                        placeholder="Street / Office Address"
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-medium text-slate-800 text-xs truncate">{lead.street || "-"}</span>
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

                  {/* City / Country */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      City / Country
                    </div>
                    {isInlineEditing ? (
                      <input
                        type="text"
                        value={editForm.city}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                        placeholder="Dubai / UAE"
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-medium text-slate-800 text-xs truncate">{lead.city || "Dubai"}</span>
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
              </div>
            )}
          </div>

          {/* Section 3: Qualification & Notes */}
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
                  Qualification & Notes
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-normal">
                Requirements, timeline, budget specifics & decision process
              </span>
            </button>

            {openSections.notes && (
              <div className="p-4 group">
                {isInlineEditing ? (
                  <textarea
                    rows={4}
                    value={editForm.qualificationNotes}
                    onChange={(e) => setEditForm({ ...editForm, qualificationNotes: e.target.value })}
                    placeholder="Document purchasing timeline, preferred unit types, financing requirements or special conditions..."
                    className="w-full p-3 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 leading-relaxed shadow-xs"
                  />
                ) : (
                  <div className="relative">
                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-100 whitespace-pre-line">
                      {lead.qualificationNotes || "No specific qualification notes logged."}
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

      {/* Tab 2: Activity Timeline */}
      {activeTab === "activities" && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Activity Timeline</h3>
          <div className="space-y-3 pt-2">
            {!lead.activities || lead.activities.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No recorded activity history yet.</p>
            ) : (
              lead.activities.map((act: any) => (
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

      {/* Tab 3: Notes */}
      {activeTab === "notes" && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Lead Notes</h3>
          <form onSubmit={handleAddNote} className="space-y-3">
            <textarea
              rows={3}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Record notes from client meetings, phone calls, property requirements..."
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

      {/* Tab 4: Related Converted Records */}
      {activeTab === "related" && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Converted Records Linkage</h3>
          {!lead.isConverted ? (
            <div className="py-8 text-center text-xs text-slate-400">
              This lead has not been converted yet. Click the &quot;Convert Lead&quot; button in the header.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              {lead.convertedAccountId && (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <span className="text-slate-500 block mb-1">Converted Account</span>
                  <Link
                    href={`/accounts/${lead.convertedAccountId}`}
                    className="font-bold text-blue-600 hover:underline flex items-center gap-1.5 text-sm"
                  >
                    <Building2 className="w-4 h-4 text-blue-600" />
                    View Account
                  </Link>
                </div>
              )}
              {lead.convertedContactId && (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <span className="text-slate-500 block mb-1">Converted Contact</span>
                  <Link
                    href={`/contacts/${lead.convertedContactId}`}
                    className="font-bold text-blue-600 hover:underline flex items-center gap-1.5 text-sm"
                  >
                    <Users className="w-4 h-4 text-blue-600" />
                    View Contact
                  </Link>
                </div>
              )}
              {lead.convertedOpportunityId && (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <span className="text-slate-500 block mb-1">Converted Opportunity</span>
                  <Link
                    href={`/opportunities/${lead.convertedOpportunityId}`}
                    className="font-bold text-blue-600 hover:underline flex items-center gap-1.5 text-sm"
                  >
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    View Opportunity
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Salesforce Lead Conversion Modal */}
      {showConvertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-in fade-in">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                Convert Lead: {fullName}
              </h2>
              <button
                onClick={() => setShowConvertModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            {/* If conversion completed successfully, show Direct Navigation Cards */}
            {conversionSuccess ? (
              <div className="p-6 space-y-6 text-center">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Lead Successfully Converted!</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    The lead has been converted into the following CRM records:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                  {conversionSuccess.account && (
                    <Link
                      href={`/accounts/${conversionSuccess.account.id}`}
                      className="p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 transition-all block group"
                    >
                      <Building2 className="w-5 h-5 text-blue-600 mb-2" />
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Account</span>
                      <span className="font-bold text-slate-900 text-xs block group-hover:text-blue-600 truncate">
                        {conversionSuccess.account.name || conversionSuccess.account.companyName}
                      </span>
                      <span className="text-[10px] text-blue-600 mt-2 flex items-center gap-1 font-semibold">
                        Open Account <ArrowRight className="w-3 h-3" />
                      </span>
                    </Link>
                  )}

                  {conversionSuccess.contact && (
                    <Link
                      href={`/contacts/${conversionSuccess.contact.id}`}
                      className="p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 transition-all block group"
                    >
                      <Users className="w-5 h-5 text-blue-600 mb-2" />
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Contact</span>
                      <span className="font-bold text-slate-900 text-xs block group-hover:text-blue-600 truncate">
                        {conversionSuccess.contact.firstName} {conversionSuccess.contact.lastName}
                      </span>
                      <span className="text-[10px] text-blue-600 mt-2 flex items-center gap-1 font-semibold">
                        Open Contact <ArrowRight className="w-3 h-3" />
                      </span>
                    </Link>
                  )}

                  {conversionSuccess.opportunity && (
                    <Link
                      href={`/opportunities/${conversionSuccess.opportunity.id}`}
                      className="p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 transition-all block group"
                    >
                      <TrendingUp className="w-5 h-5 text-blue-600 mb-2" />
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Opportunity</span>
                      <span className="font-bold text-slate-900 text-xs block group-hover:text-blue-600 truncate">
                        {conversionSuccess.opportunity.name}
                      </span>
                      <span className="text-[10px] text-blue-600 mt-2 flex items-center gap-1 font-semibold">
                        Open Deal <ArrowRight className="w-3 h-3" />
                      </span>
                    </Link>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-center">
                  <button
                    onClick={() => setShowConvertModal(false)}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
                  >
                    Done & Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConvertSubmit} className="p-6 space-y-6 text-xs">
                {/* 1. Account Section */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      1. Account Destination
                    </span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                        <input
                          type="radio"
                          name="accOpt"
                          checked={convertForm.accountOption === "create"}
                          onChange={() => setConvertForm({ ...convertForm, accountOption: "create" })}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        Create New
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                        <input
                          type="radio"
                          name="accOpt"
                          checked={convertForm.accountOption === "existing"}
                          onChange={() => setConvertForm({ ...convertForm, accountOption: "existing" })}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        Choose Existing
                      </label>
                    </div>
                  </div>

                  {convertForm.accountOption === "create" ? (
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">New Account Name *</label>
                      <input
                        type="text"
                        required
                        value={convertForm.accountName}
                        onChange={(e) => setConvertForm({ ...convertForm, accountName: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Select Existing Account *</label>
                      <select
                        required
                        value={convertForm.accountId}
                        onChange={(e) => setConvertForm({ ...convertForm, accountId: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="">-- Choose Account --</option>
                        {existingAccounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name || a.companyName || a.accountNumber}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* 2. Contact Section */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-blue-600" />
                      2. Contact Record
                    </span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                        <input
                          type="radio"
                          name="contOpt"
                          checked={convertForm.contactOption === "create"}
                          onChange={() => setConvertForm({ ...convertForm, contactOption: "create" })}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        Create New ({fullName})
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                        <input
                          type="radio"
                          name="contOpt"
                          checked={convertForm.contactOption === "existing"}
                          onChange={() => setConvertForm({ ...convertForm, contactOption: "existing" })}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        Choose Existing
                      </label>
                    </div>
                  </div>

                  {convertForm.contactOption === "existing" && (
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Select Existing Contact *</label>
                      <select
                        required
                        value={convertForm.contactId}
                        onChange={(e) => setConvertForm({ ...convertForm, contactId: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="">-- Choose Contact --</option>
                        {existingContacts.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.firstName} {c.lastName} ({c.email || c.mobile || "No phone"})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* 3. Opportunity Section */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      3. Opportunity
                    </span>
                    <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={convertForm.opportunityOption === "skip"}
                        onChange={(e) =>
                          setConvertForm({
                            ...convertForm,
                            opportunityOption: e.target.checked ? "skip" : "create",
                          })
                        }
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      Do not create opportunity upon conversion
                    </label>
                  </div>

                  {convertForm.opportunityOption === "create" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-slate-600 font-medium mb-1">Opportunity Name *</label>
                        <input
                          type="text"
                          required
                          value={convertForm.opportunityName}
                          onChange={(e) => setConvertForm({ ...convertForm, opportunityName: e.target.value })}
                          className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-600 font-medium mb-1">Estimated Amount (AED)</label>
                          <input
                            type="number"
                            value={convertForm.opportunityAmount}
                            onChange={(e) => setConvertForm({ ...convertForm, opportunityAmount: e.target.value })}
                            className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 font-medium mb-1">Stage</label>
                          <select
                            value={convertForm.opportunityStage}
                            onChange={(e) => setConvertForm({ ...convertForm, opportunityStage: e.target.value })}
                            className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                          >
                            <option value="PROSPECTING">Prospecting</option>
                            <option value="QUALIFICATION">Qualification</option>
                            <option value="NEEDS_ANALYSIS">Needs Analysis</option>
                            <option value="PROPOSAL">Proposal</option>
                            <option value="NEGOTIATION">Negotiation</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-600 font-medium mb-1">Schedule Unit Visit</label>
                          <input
                            type="datetime-local"
                            value={convertForm.scheduledVisitDate}
                            onChange={(e) => setConvertForm({ ...convertForm, scheduledVisitDate: e.target.value })}
                            className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 font-medium mb-1">Payment Method</label>
                          <select
                            value={convertForm.paymentMethod}
                            onChange={(e) => setConvertForm({ ...convertForm, paymentMethod: e.target.value })}
                            className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                          >
                            <option value="">-- Select Payment Method --</option>
                            <option value="Cash">Cash</option>
                            <option value="Loan">Loan</option>
                            <option value="Mortgage">Mortgage</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Cash + Loan">Cash + Loan</option>
                            <option value="Developer Payment Plan">Developer Payment Plan</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-slate-600 font-medium mb-1">Payment Plan Structure</label>
                        <select
                          value={convertForm.paymentPlan}
                          onChange={(e) => setConvertForm({ ...convertForm, paymentPlan: e.target.value })}
                          className="w-full p-2 border border-slate-200 rounded-lg bg-white font-mono"
                        >
                          <option value="">-- Select Payment Plan --</option>
                          <option value="30/70">30/70</option>
                          <option value="40/60">40/60</option>
                          <option value="10/90">10/90</option>
                          <option value="20/80">20/80</option>
                          <option value="50/50">50/50</option>
                          <option value="60/40">60/40</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Broker / Channel Partner attribution */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Handshake className="w-4 h-4 text-blue-600" />
                    Channel Partner / Broker Attribution
                  </label>
                  <select
                    value={convertForm.brokerId}
                    onChange={(e) => setConvertForm({ ...convertForm, brokerId: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="">-- Select Broker --</option>
                    {brokersList.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}{b.contactPerson && b.contactPerson !== b.name ? ` (${b.contactPerson})` : ""} {b.tradeLicense ? `[${b.tradeLicense}]` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowConvertModal(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={converting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {converting ? "Converting Lead..." : "Convert Lead Now"}
                  </button>
                </div>
              </form>
            )}
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
                  Edit Lead: {lead?.leadNumber}
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

            <form onSubmit={handleSaveInlineEdit} className="p-6 space-y-6 text-xs">
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
      {/* Salesforce Lightning Sticky Action Bar */}
      {isInlineEditing && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3.5 px-6 shadow-2xl flex items-center justify-center gap-4 transition-all">
          <div className="text-xs text-slate-500 hidden sm:flex items-center gap-2 mr-4">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            Unsaved changes in Lead record
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
