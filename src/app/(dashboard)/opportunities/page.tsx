"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Plus,
  ArrowRight,
  Building2,
  Calendar,
  Search,
  LayoutGrid,
  List,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  Handshake,
  DollarSign,
  ChevronRight,
  Users,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatCurrency } from "@/lib/utils";

interface OpportunityBuyer {
  id: string;
  accountNumber: string;
  name?: string | null;
  companyName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  buyerType?: string;
  mobile?: string | null;
}

interface OpportunityItem {
  id: string;
  opportunityNumber: string;
  name: string;
  stage: string;
  propertyType?: string | null;
  estimatedValue: number | null;
  amount: number | null;
  budget: number | null;
  probability: number | null;
  closeDate?: string | null;
  expectedClosingDate?: string | null;
  buyerId?: string;
  contactId?: string;
  projectId?: string;
  unitId?: string;
  brokerId?: string;
  assignedAdvisorId?: string;
  scheduledVisitDate?: string | null;
  paymentMethod?: string | null;
  paymentPlan?: string | null;
  buyer: OpportunityBuyer;
  contact?: { id: string; firstName: string; lastName: string; email?: string } | null;
  project?: { id: string; name: string; code: string } | null;
  unit?: { id: string; unitNumber: string; finalPrice: number } | null;
  assignedAdvisor?: { id: string; firstName: string; lastName: string } | null;
  broker?: { id: string; name: string } | null;
  notes?: string | null;
  createdAt: string;
}

const SALESFORCE_STAGES = [
  { key: "PROSPECTING", title: "Prospecting", prob: 10 },
  { key: "QUALIFICATION", title: "Qualification", prob: 25 },
  { key: "NEEDS_ANALYSIS", title: "Needs Analysis", prob: 50 },
  { key: "PROPOSAL", title: "Proposal", prob: 75 },
  { key: "NEGOTIATION", title: "Negotiation", prob: 90 },
  { key: "CLOSED_WON", title: "Closed Won", prob: 100 },
  { key: "CLOSED_LOST", title: "Closed Lost", prob: 0 },
];

export default function OpportunitiesPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("ALL");

  // Auxiliary data
  const [accountsList, setAccountsList] = useState<any[]>([]);
  const [contactsList, setContactsList] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [unitsList, setUnitsList] = useState<any[]>([]);
  const [brokersList, setBrokersList] = useState<any[]>([]);
  const [advisorsList, setAdvisorsList] = useState<any[]>([]);

  // Edit Modal State - Full 14 Fields
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOpp, setEditingOpp] = useState<OpportunityItem | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    buyerId: "",
    contactId: "",
    amount: "",
    budget: "",
    stage: "PROSPECTING",
    probability: "50",
    closeDate: "",
    propertyType: "APARTMENT",
    brokerId: "",
    projectId: "",
    unitId: "",
    assignedAdvisorId: "",
    scheduledVisitDate: "",
    paymentMethod: "",
    paymentPlan: "",
    notes: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    buyerId: "",
    stage: "PROSPECTING",
    amount: "2500000",
    probability: "50",
    closeDate: "",
    propertyType: "APARTMENT",
    scheduledVisitDate: "",
    paymentMethod: "",
    paymentPlan: "",
    notes: "",
  });
  const [savingCreate, setSavingCreate] = useState(false);

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/opportunities");
      const data = await res.json();
      if (res.ok) {
        setOpportunities(data.opportunities || []);
      } else {
        addToast("error", data.error || "Failed to load opportunities");
      }
    } catch {
      addToast("error", "Error loading opportunities");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchOpportunities();
    fetch("/api/accounts?limit=100").then((r) => r.json()).then((d) => setAccountsList(d.accounts || [])).catch(() => {});
    fetch("/api/contacts?limit=100").then((r) => r.json()).then((d) => setContactsList(d.contacts || [])).catch(() => {});
    fetch("/api/projects").then((r) => r.json()).then((d) => setProjectsList(d.projects || [])).catch(() => {});
    fetch("/api/units").then((r) => r.json()).then((d) => setUnitsList(d.units || [])).catch(() => {});
    fetch("/api/brokers").then((r) => r.json()).then((d) => setBrokersList(d.brokers || [])).catch(() => {});
    fetch("/api/users").then((r) => r.json()).then((d) => setAdvisorsList(d.users || [])).catch(() => {});
  }, [fetchOpportunities]);

  const filteredOpps = useMemo(() => {
    return opportunities.filter((opp) => {
      const matchSearch =
        opp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.opportunityNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (opp.buyer?.name || opp.buyer?.companyName || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchStage = stageFilter === "ALL" || opp.stage === stageFilter;
      return matchSearch && matchStage;
    });
  }, [opportunities, searchTerm, stageFilter]);

  const totalPipelineValue = useMemo(() => {
    return opportunities
      .filter((o) => o.stage !== "CLOSED_LOST")
      .reduce((sum, o) => sum + (o.amount || o.estimatedValue || 0), 0);
  }, [opportunities]);

  const handleOpenEdit = (opp: OpportunityItem) => {
    setEditingOpp(opp);
    let formattedVisit = "";
    if (opp.scheduledVisitDate) {
      try {
        const d = new Date(opp.scheduledVisitDate);
        formattedVisit = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      } catch {
        formattedVisit = "";
      }
    }

    setEditForm({
      name: opp.name,
      buyerId: opp.buyerId || opp.buyer?.id || "",
      contactId: opp.contactId || opp.contact?.id || "",
      amount: (opp.amount || opp.estimatedValue || 0).toString(),
      budget: (opp.budget || opp.estimatedValue || 0).toString(),
      stage: opp.stage,
      probability: (opp.probability ?? 50).toString(),
      closeDate: opp.closeDate ? opp.closeDate.split("T")[0] : (opp.expectedClosingDate ? opp.expectedClosingDate.split("T")[0] : ""),
      propertyType: opp.propertyType || "APARTMENT",
      brokerId: opp.brokerId || opp.broker?.id || "",
      projectId: opp.projectId || opp.project?.id || "",
      unitId: opp.unitId || opp.unit?.id || "",
      assignedAdvisorId: opp.assignedAdvisorId || opp.assignedAdvisor?.id || "",
      scheduledVisitDate: formattedVisit,
      paymentMethod: opp.paymentMethod || "",
      paymentPlan: opp.paymentPlan || "",
      notes: opp.notes || "",
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOpp) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/opportunities/${editingOpp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          buyerId: editForm.buyerId,
          contactId: editForm.contactId || null,
          amount: Number(editForm.amount),
          estimatedValue: Number(editForm.amount),
          budget: editForm.budget ? Number(editForm.budget) : null,
          stage: editForm.stage,
          probability: Number(editForm.probability),
          closeDate: editForm.closeDate || null,
          expectedClosingDate: editForm.closeDate || null,
          propertyType: editForm.propertyType,
          brokerId: editForm.brokerId || null,
          projectId: editForm.projectId || null,
          unitId: editForm.unitId || null,
          assignedAdvisorId: editForm.assignedAdvisorId || null,
          scheduledVisitDate: editForm.scheduledVisitDate ? new Date(editForm.scheduledVisitDate).toISOString() : null,
          paymentMethod: editForm.paymentMethod || null,
          paymentPlan: editForm.paymentPlan || null,
          notes: editForm.notes,
          description: editForm.notes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast("success", "Opportunity updated successfully");
        setShowEditModal(false);
        fetchOpportunities();
      } else {
        addToast("error", data.error || "Failed to update opportunity");
      }
    } catch {
      addToast("error", "Error updating opportunity");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name || !createForm.buyerId) {
      addToast("error", "Name and Account are required");
      return;
    }
    setSavingCreate(true);
    try {
      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name,
          buyerId: createForm.buyerId,
          stage: createForm.stage,
          estimatedValue: Number(createForm.amount),
          amount: Number(createForm.amount),
          budget: Number(createForm.amount),
          probability: Number(createForm.probability),
          expectedClosingDate: createForm.closeDate || null,
          propertyType: createForm.propertyType,
          scheduledVisitDate: createForm.scheduledVisitDate ? new Date(createForm.scheduledVisitDate).toISOString() : null,
          paymentMethod: createForm.paymentMethod || null,
          paymentPlan: createForm.paymentPlan || null,
          notes: createForm.notes,
        }),
      });
      if (res.ok) {
        addToast("success", "Opportunity created");
        setShowCreateModal(false);
        setCreateForm({
          name: "",
          buyerId: "",
          stage: "PROSPECTING",
          amount: "2500000",
          probability: "50",
          closeDate: "",
          propertyType: "APARTMENT",
          scheduledVisitDate: "",
          paymentMethod: "",
          paymentPlan: "",
          notes: "",
        });
        fetchOpportunities();
      } else {
        const d = await res.json();
        addToast("error", d.error || "Failed to create opportunity");
      }
    } catch {
      addToast("error", "Error creating opportunity");
    } finally {
      setSavingCreate(false);
    }
  };

  const handleAdvanceStage = async (opp: OpportunityItem) => {
    const stageKeys = SALESFORCE_STAGES.map((s) => s.key);
    const currentIndex = stageKeys.indexOf(opp.stage);
    if (currentIndex === -1 || currentIndex >= stageKeys.length - 2) {
      addToast("info", "Opportunity is already in closing stage");
      return;
    }
    const nextStage = stageKeys[currentIndex + 1];
    try {
      const res = await fetch(`/api/opportunities/${opp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: nextStage }),
      });
      if (res.ok) {
        addToast("success", `Advanced stage to ${nextStage}`);
        fetchOpportunities();
      }
    } catch {
      addToast("error", "Failed to advance stage");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete opportunity "${name}"?`)) return;
    try {
      const res = await fetch(`/api/opportunities/${id}`, { method: "DELETE" });
      if (res.ok) {
        addToast("success", "Opportunity deleted");
        fetchOpportunities();
      } else {
        const d = await res.json();
        addToast("error", d.error || "Failed to delete opportunity");
      }
    } catch {
      addToast("error", "Error deleting opportunity");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            Opportunities
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage sales pipeline, revenue forecasting, deal progression, and unit bookings
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700">
            Pipeline: {formatCurrency(totalPipelineValue)}
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            New Opportunity
          </button>
        </div>
      </div>

      {/* View Toggle & Filters */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by deal name, account, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-600 bg-white"
            />
          </div>

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-600 bg-white text-slate-700"
          >
            <option value="ALL">All Stages</option>
            {SALESFORCE_STAGES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.title}
              </option>
            ))}
          </select>
        </div>

        {/* Kanban vs Table switch */}
        <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50">
          <button
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors ${
              viewMode === "table" ? "bg-white text-blue-600 shadow-xs border border-slate-200" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            Table
          </button>
          <button
            onClick={() => setViewMode("kanban")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors ${
              viewMode === "kanban" ? "bg-white text-blue-600 shadow-xs border border-slate-200" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Kanban
          </button>
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === "table" ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Opportunity</th>
                  <th className="py-3 px-4">Account / Buyer</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Deal Amount</th>
                  <th className="py-3 px-4">Win Prob.</th>
                  <th className="py-3 px-4">Close Date</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Loading opportunities...
                    </td>
                  </tr>
                ) : filteredOpps.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No opportunities found.
                    </td>
                  </tr>
                ) : (
                  filteredOpps.map((opp) => {
                    const buyerName =
                      opp.buyer?.name ||
                      opp.buyer?.companyName ||
                      `${opp.buyer?.firstName || ""} ${opp.buyer?.lastName || ""}`.trim() ||
                      "-";

                    return (
                      <tr key={opp.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="py-3 px-4">
                          <Link
                            href={`/opportunities/${opp.id}`}
                            className="font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1.5"
                          >
                            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                            {opp.name}
                          </Link>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {opp.opportunityNumber}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Link
                            href={`/accounts/${opp.buyer?.id}`}
                            className="text-slate-800 hover:text-blue-600 font-medium hover:underline flex items-center gap-1"
                          >
                            <Building2 className="w-3 h-3 text-slate-400" />
                            {buyerName}
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            {opp.stage}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {formatCurrency(opp.amount || opp.estimatedValue || 0)}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                              <div
                                className="h-full bg-blue-600"
                                style={{ width: `${opp.probability || 50}%` }}
                              />
                            </div>
                            <span className="font-semibold">{opp.probability || 50}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {formatDate(opp.closeDate || opp.expectedClosingDate)}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {opp.assignedAdvisor ? `${opp.assignedAdvisor.firstName} ${opp.assignedAdvisor.lastName}` : "Unassigned"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* User specifically requested: Opportunity View and Edit options! */}
                            <Link
                              href={`/opportunities/${opp.id}`}
                              className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold transition-colors flex items-center gap-1"
                              title="View all fields"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </Link>
                            <button
                              onClick={() => handleOpenEdit(opp)}
                              className="px-2 py-1 rounded bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold transition-colors flex items-center gap-1"
                              title="Edit Opportunity"
                            >
                              <Edit className="w-3.5 h-3.5 text-slate-500" />
                              Edit
                            </button>
                            {opp.stage !== "CLOSED_WON" && opp.stage !== "CLOSED_LOST" && (
                              <button
                                onClick={() => handleAdvanceStage(opp)}
                                className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors flex items-center gap-1"
                                title="Advance Stage"
                              >
                                Advance
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(opp.id, opp.name)}
                              className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                              title="Delete Opportunity"
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
        </div>
      ) : (
        /* KANBAN VIEW */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto pb-4">
          {SALESFORCE_STAGES.filter((s) => s.key !== "CLOSED_LOST").map((stage) => {
            const stageOpps = filteredOpps.filter((o) => o.stage === stage.key);
            const stageValue = stageOpps.reduce((sum, o) => sum + (o.amount || o.estimatedValue || 0), 0);

            return (
              <div key={stage.key} className="bg-slate-50/70 rounded-xl border border-slate-200 p-3 min-w-[220px] flex flex-col h-full">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">{stage.title}</h3>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatCurrency(stageValue)}
                    </span>
                  </div>
                  <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold flex items-center justify-center">
                    {stageOpps.length}
                  </span>
                </div>

                <div className="space-y-2 flex-1">
                  {stageOpps.length === 0 ? (
                    <div className="py-6 text-center text-[11px] text-slate-400">
                      Empty stage
                    </div>
                  ) : (
                    stageOpps.map((opp) => (
                      <div
                        key={opp.id}
                        className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs hover:border-blue-400 transition-all text-xs space-y-2"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <Link
                            href={`/opportunities/${opp.id}`}
                            className="font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1"
                          >
                            {opp.name}
                          </Link>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            {opp.probability}%
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-600 flex items-center gap-1 truncate">
                          <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {opp.buyer?.name || opp.buyer?.companyName || "Account"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          <span className="font-bold text-blue-600 text-xs">
                            {formatCurrency(opp.amount || opp.estimatedValue || 0)}
                          </span>

                          <div className="flex items-center gap-1">
                            <Link
                              href={`/opportunities/${opp.id}`}
                              className="p-1 rounded hover:bg-blue-50 text-slate-500 hover:text-blue-600"
                              title="View All Fields"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              onClick={() => handleOpenEdit(opp)}
                              className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                              title="Edit Opportunity"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleAdvanceStage(opp)}
                              className="p-1 rounded hover:bg-blue-50 text-blue-600 font-bold"
                              title="Next Stage"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Opportunity Modal - Full 14-Field Salesforce Experience */}
      {showEditModal && editingOpp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Edit className="w-4 h-4 text-blue-600" />
                  Edit Opportunity: {editingOpp.opportunityNumber}
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Update commercial, account, inventory and broker specifications for this deal
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
              {/* Section 1: Opportunity Information */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    1. Opportunity Information
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium">Core Deal & Customer Details</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Opportunity Name */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Opportunity Name <span className="text-blue-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="e.g. Marina Penthouse Acquisition"
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  {/* Right: Account */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Account (Buyer / Organization) <span className="text-blue-600">*</span>
                    </label>
                    <select
                      required
                      value={editForm.buyerId}
                      onChange={(e) => setEditForm({ ...editForm, buyerId: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="">-- Select Buyer Account --</option>
                      {accountsList.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name || acc.companyName || `${acc.firstName || ""} ${acc.lastName || ""}`.trim() || acc.accountNumber} ({acc.accountNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Left: Designated Contact */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Designated Contact
                    </label>
                    <select
                      value={editForm.contactId}
                      onChange={(e) => setEditForm({ ...editForm, contactId: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="">-- None / Unassigned --</option>
                      {contactsList
                        .filter((c) => !editForm.buyerId || c.buyerAccountId === editForm.buyerId || c.accountId === editForm.buyerId || c.id === editForm.contactId)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.firstName} {c.lastName} {c.email ? `(${c.email})` : ""}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Right: Referring Channel Partner / Broker */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Referring Broker / Channel Partner
                    </label>
                    <select
                      value={editForm.brokerId}
                      onChange={(e) => setEditForm({ ...editForm, brokerId: e.target.value })}
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

                  {/* Left: Deal Amount */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Deal Amount (AED)
                    </label>
                    <input
                      type="number"
                      value={editForm.amount}
                      onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                      placeholder="e.g. 2800000"
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  {/* Right: Client Budget */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Client Budget (AED)
                    </label>
                    <input
                      type="number"
                      value={editForm.budget}
                      onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
                      placeholder="e.g. 3000000"
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  {/* Left: Pipeline Stage */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Pipeline Stage
                    </label>
                    <select
                      value={editForm.stage}
                      onChange={(e) => setEditForm({ ...editForm, stage: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    >
                      {SALESFORCE_STAGES.map((s) => (
                        <option key={s.key} value={s.key}>{s.title}</option>
                      ))}
                    </select>
                  </div>

                  {/* Right: Win Probability */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Win Probability (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editForm.probability}
                      onChange={(e) => setEditForm({ ...editForm, probability: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  {/* Left: Expected Close Date */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Expected Close Date
                    </label>
                    <input
                      type="date"
                      value={editForm.closeDate}
                      onChange={(e) => setEditForm({ ...editForm, closeDate: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  {/* Right: Property Type */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Property Type
                    </label>
                    <select
                      value={editForm.propertyType}
                      onChange={(e) => setEditForm({ ...editForm, propertyType: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="APARTMENT">Apartment</option>
                      <option value="PENTHOUSE">Penthouse</option>
                      <option value="VILLA">Villa</option>
                      <option value="TOWNHOUSE">Townhouse</option>
                      <option value="COMMERCIAL">Commercial Office</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Project & Inventory Linkage */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    2. Project & Inventory Linkage
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium">Real Estate Asset Allocation</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Project Development */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Project Development
                    </label>
                    <select
                      value={editForm.projectId}
                      onChange={(e) => setEditForm({ ...editForm, projectId: e.target.value, unitId: "" })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="">-- None / General Project Inquiry --</option>
                      {projectsList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Right: Allocated Unit */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Allocated Unit
                    </label>
                    <select
                      value={editForm.unitId}
                      onChange={(e) => setEditForm({ ...editForm, unitId: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="">Pending Shortlisting / None</option>
                      {unitsList
                        .filter((u) => !editForm.projectId || u.projectId === editForm.projectId || u.id === editForm.unitId)
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            Unit #{u.unitNumber} {u.building?.name ? `(${u.building.name})` : ""} - AED {u.finalPrice?.toLocaleString() || "N/A"}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Row 2: Schedule Unit Visit (Left) & Payment Method (Right) */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Schedule Unit (Apartment Visit Date & Time)
                    </label>
                    <input
                      type="datetime-local"
                      value={editForm.scheduledVisitDate}
                      onChange={(e) => setEditForm({ ...editForm, scheduledVisitDate: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Payment Method / Financing Mode
                    </label>
                    <select
                      value={editForm.paymentMethod}
                      onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
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

                  {/* Row 3: Payment Plan (Left) & Owner / Sales Advisor (Right) */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Payment Plan Structure
                    </label>
                    <select
                      value={editForm.paymentPlan}
                      onChange={(e) => setEditForm({ ...editForm, paymentPlan: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono"
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

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Owner / Sales Advisor
                    </label>
                    <select
                      value={editForm.assignedAdvisorId}
                      onChange={(e) => setEditForm({ ...editForm, assignedAdvisorId: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="">-- Unassigned --</option>
                      {advisorsList.map((adv) => (
                        <option key={adv.id} value={adv.id}>
                          {adv.firstName} {adv.lastName} ({adv.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Row 4: Opportunity Reference */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Opportunity Reference
                    </label>
                    <input
                      type="text"
                      disabled
                      value={editingOpp.opportunityNumber}
                      className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 font-mono cursor-not-allowed"
                    />
                  </div>

                  <div className="flex items-center text-slate-400 text-[11px] pt-4">
                    <span>* Visit date and payment terms synchronize with buyer timeline</span>
                  </div>
                </div>
              </div>

              {/* Section 3: Description & Requirements */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    3. Description & Deal Notes
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium">Customer Requirements & Specifications</span>
                </div>
                <div>
                  <textarea
                    rows={3}
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    placeholder="Document client preferences, unit specifications, purchasing timeline or negotiation details..."
                    className="w-full p-3 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 leading-relaxed"
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
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

      {/* Create Opportunity Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                New Opportunity
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">×</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Opportunity Name <span className="text-blue-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="e.g. Marina View 3-Bedroom Deal"
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Account <span className="text-blue-600">*</span>
                  </label>
                  <select
                    required
                    value={createForm.buyerId}
                    onChange={(e) => setCreateForm({ ...createForm, buyerId: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="">-- Choose Account --</option>
                    {accountsList.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name || a.companyName || `${a.firstName || ""} ${a.lastName || ""}`.trim() || a.accountNumber} ({a.accountNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pipeline Stage</label>
                  <select
                    value={createForm.stage}
                    onChange={(e) => setCreateForm({ ...createForm, stage: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  >
                    {SALESFORCE_STAGES.map((s) => (
                      <option key={s.key} value={s.key}>{s.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount (AED)</label>
                  <input
                    type="number"
                    value={createForm.amount}
                    onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Win Probability (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={createForm.probability}
                    onChange={(e) => setCreateForm({ ...createForm, probability: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expected Close Date</label>
                  <input
                    type="date"
                    value={createForm.closeDate}
                    onChange={(e) => setCreateForm({ ...createForm, closeDate: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Schedule Unit Visit</label>
                  <input
                    type="datetime-local"
                    value={createForm.scheduledVisitDate}
                    onChange={(e) => setCreateForm({ ...createForm, scheduledVisitDate: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={createForm.paymentMethod}
                    onChange={(e) => setCreateForm({ ...createForm, paymentMethod: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
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

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Plan Structure</label>
                  <select
                    value={createForm.paymentPlan}
                    onChange={(e) => setCreateForm({ ...createForm, paymentPlan: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono"
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

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCreate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingCreate ? "Creating..." : "Create Opportunity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
