"use client";

import { useEffect, useState, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  FileText,
  FileSignature,
  Clock,
  ShieldCheck,
  Plus,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatCurrency } from "@/lib/utils";

type TabKey = "overview" | "opportunities" | "eoi" | "quotations" | "orders" | "kyc" | "activities";

interface BuyerOpportunity {
  id: string;
  name: string;
  propertyType: string;
  stage: string;
  estimatedValue?: number | null;
  project?: { id: string; name: string; code: string } | null;
  unit?: { id: string; unitNumber: string; finalPrice: number } | null;
}

interface BuyerEOI {
  id: string;
  eoiNumber: string;
  status: string;
  tokenAmount: number;
  eoiDate: string;
  project?: { name: string } | null;
  unit?: { unitNumber: string } | null;
}

interface BuyerQuotation {
  id: string;
  quotationNumber: string;
  status: string;
  finalPrice: number;
  createdAt: string;
  unit?: { unitNumber: string } | null;
  paymentMilestones?: Array<{ id: string; stageName: string; amount: number }>;
}

interface BuyerPO {
  id: string;
  poNumber: string;
  status: string;
  finalAmount: number;
  createdAt: string;
  unit?: { unitNumber: string } | null;
  project?: { name: string } | null;
}

interface BuyerChecklistItem {
  id: string;
  documentName: string;
  isRequired: boolean;
  status: string;
  documents?: Array<{ id: string; originalName: string; uploadedAt: string }>;
}

interface BuyerActivity {
  id: string;
  subject: string;
  description?: string | null;
  type: string;
  createdAt: string;
  createdBy: { firstName: string; lastName: string };
}

interface BuyerDetail {
  id: string;
  accountNumber: string;
  buyerType: string;
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  email?: string | null;
  mobile?: string | null;
  nationality?: string | null;
  countryOfResidence?: string | null;
  passportNumber?: string | null;
  nationalId?: string | null;
  createdAt: string;
  relationshipManager?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  opportunities?: BuyerOpportunity[];
  eois?: BuyerEOI[];
  quotations?: BuyerQuotation[];
  purchaseOrders?: BuyerPO[];
  onboarding?: {
    id: string;
    status: string;
    completionPercentage: number;
    checklistItems?: BuyerChecklistItem[];
  } | null;
  documents?: Array<{ id: string; originalName: string; category: string }>;
  activities?: BuyerActivity[];
}

export default function BuyerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { addToast } = useToast();
  const resolvedParams = use(params);
  const buyerId = resolvedParams.id;

  const [buyer, setBuyer] = useState<BuyerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const loadBuyer = useCallback(async () => {
    try {
      const res = await fetch(`/api/buyers/${buyerId}`);
      if (!res.ok) throw new Error("Buyer not found");
      const data = await res.json();
      setBuyer(data.buyer);
    } catch {
      addToast("error", "Error", "Failed to load buyer details");
    } finally {
      setLoading(false);
    }
  }, [buyerId, addToast]);

  useEffect(() => {
    loadBuyer();
  }, [loadBuyer]);

  if (loading) {
    return <div className="py-20 text-center text-xs text-[#64748B]">Loading Buyer 360 View...</div>;
  }

  if (!buyer) {
    return <div className="py-20 text-center text-xs text-rose-600">Buyer account not found.</div>;
  }

  const displayName =
    buyer.buyerType === "CORPORATE"
      ? buyer.companyName
      : `${buyer.firstName || ""} ${buyer.lastName || ""}`.trim();

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/buyers")}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#172033] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Buyers
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/eoi")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#153B66] hover:bg-[#102C4C] text-white text-xs font-semibold rounded-lg shadow-xs"
          >
            <FileSignature className="w-3.5 h-3.5" />
            Create EOI
          </button>
          <button
            onClick={() => router.push("/onboarding")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#172033] text-xs font-semibold rounded-lg shadow-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            KYC Checklist
          </button>
        </div>
      </div>

      {/* Buyer 360 Header Card */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#102C4C] text-white rounded-2xl flex items-center justify-center text-lg font-bold shadow-xs">
              {buyer.buyerType === "CORPORATE" ? (
                <Briefcase className="w-6 h-6" />
              ) : (
                `${buyer.firstName?.[0] || ""}${buyer.lastName?.[0] || ""}`
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-[#172033]">{displayName}</h1>
                <span className="font-mono text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded">
                  {buyer.accountNumber}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                    buyer.buyerType === "CORPORATE"
                      ? "bg-purple-50 text-purple-700 border-purple-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}
                >
                  {buyer.buyerType}
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-1">
                {buyer.nationality || "UAE"} • {buyer.countryOfResidence || "UAE"} • Registered on {formatDate(buyer.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <span className="text-[#94A3B8] block text-[10px] uppercase font-bold">
                Opportunities
              </span>
              <span className="text-sm font-bold text-[#172033]">
                {buyer.opportunities?.length || 0} Active
              </span>
            </div>
            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <span className="text-[#94A3B8] block text-[10px] uppercase font-bold">
                EOI Submitted
              </span>
              <span className="text-sm font-bold text-[#172033]">
                {buyer.eois?.length || 0}
              </span>
            </div>
            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <span className="text-[#94A3B8] block text-[10px] uppercase font-bold">
                Purchases Confirmed
              </span>
              <span className="text-sm font-bold text-emerald-700">
                {buyer.purchaseOrders?.length || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] overflow-x-auto pb-1">
        {[
          { id: "overview" as TabKey, label: "Account Overview" },
          { id: "opportunities" as TabKey, label: `Opportunities (${buyer.opportunities?.length || 0})` },
          { id: "eoi" as TabKey, label: `EOIs & Reservations (${buyer.eois?.length || 0})` },
          { id: "quotations" as TabKey, label: `Quotations (${buyer.quotations?.length || 0})` },
          { id: "orders" as TabKey, label: `Purchase Orders (${buyer.purchaseOrders?.length || 0})` },
          { id: "kyc" as TabKey, label: "KYC & Documents" },
          { id: "activities" as TabKey, label: `Timeline (${buyer.activities?.length || 0})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-xs font-semibold whitespace-nowrap rounded-lg transition-colors ${
              activeTab === tab.id
                ? "bg-[#153B66] text-white"
                : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#172033]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
              Contact & Identification
            </h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Primary Phone:</span>
                <span className="font-semibold text-[#172033]">{buyer.mobile || "-"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Email:</span>
                <span className="font-semibold text-[#172033]">{buyer.email || "-"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Passport #:</span>
                <span className="font-mono font-semibold text-[#172033]">
                  {buyer.passportNumber || "Not Provided"}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[#64748B]">National / Emirates ID:</span>
                <span className="font-mono font-semibold text-[#172033]">
                  {buyer.nationalId || "Not Provided"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
              Onboarding & Compliance
            </h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Onboarding Status:</span>
                <StatusBadge status={buyer.onboarding?.status || "NOT_STARTED"} />
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Checklist Completion:</span>
                <span className="font-bold text-[#172033]">
                  {buyer.onboarding?.completionPercentage ?? 0}%
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Relationship Manager:</span>
                <span className="font-semibold text-[#172033]">
                  {buyer.relationshipManager
                    ? `${buyer.relationshipManager.firstName} ${buyer.relationshipManager.lastName}`
                    : "Unassigned"}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[#64748B]">Total Documents Vaulted:</span>
                <span className="font-semibold text-[#172033]">
                  {buyer.documents?.length || 0} Files
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "opportunities" && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#172033]">Buyer Opportunities</h2>
            <button
              onClick={() => router.push("/opportunities")}
              className="text-xs text-[#2563EB] font-semibold hover:underline"
            >
              Open Pipeline View →
            </button>
          </div>
          <div className="space-y-3">
            {(buyer.opportunities || []).map((opp: BuyerOpportunity) => (
              <div
                key={opp.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors"
              >
                <div>
                  <p className="text-xs font-bold text-[#172033]">{opp.name}</p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    {opp.project?.name || "General"} • {opp.propertyType}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-emerald-700">
                    {opp.estimatedValue ? formatCurrency(opp.estimatedValue) : "-"}
                  </span>
                  <StatusBadge status={opp.stage} />
                </div>
              </div>
            ))}
            {(!buyer.opportunities || buyer.opportunities.length === 0) && (
              <p className="py-8 text-center text-xs text-[#94A3B8]">
                No opportunities logged for this buyer.
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === "eoi" && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#172033]">Expression of Interest Records</h2>
            <button
              onClick={() => router.push("/eoi")}
              className="text-xs text-[#2563EB] font-semibold hover:underline"
            >
              Manage EOIs & Reservations →
            </button>
          </div>
          <div className="space-y-3">
            {(buyer.eois || []).map((eoi: BuyerEOI) => (
              <div
                key={eoi.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC]"
              >
                <div>
                  <p className="font-mono text-xs font-bold text-[#2563EB]">{eoi.eoiNumber}</p>
                  <p className="text-xs text-[#172033] mt-0.5 font-medium">
                    Unit: {eoi.unit?.unitNumber} ({eoi.project?.name})
                  </p>
                  <p className="text-[11px] text-[#64748B]">Token: {formatCurrency(eoi.tokenAmount)}</p>
                </div>
                <div className="text-right space-y-1">
                  <StatusBadge status={eoi.status} />
                  <p className="text-[10px] text-[#94A3B8]">{formatDate(eoi.eoiDate)}</p>
                </div>
              </div>
            ))}
            {(!buyer.eois || buyer.eois.length === 0) && (
              <p className="py-8 text-center text-xs text-[#94A3B8]">No EOIs recorded.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "quotations" && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#172033]">Official Quotations</h2>
              <p className="text-xs text-[#64748B]">Commercial offers and milestone payment plans</p>
            </div>
            <button
              onClick={() => router.push("/quotations")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#153B66] hover:bg-[#102C4C] text-white text-xs font-semibold rounded-lg shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Open Quotations Hub
            </button>
          </div>
          <div className="space-y-3">
            {(buyer.quotations || []).map((q: BuyerQuotation) => (
              <div
                key={q.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC]"
              >
                <div>
                  <p className="font-mono text-xs font-bold text-[#2563EB]">{q.quotationNumber}</p>
                  <p className="text-xs font-medium text-[#172033] mt-0.5">
                    Unit {q.unit?.unitNumber} • Net Investment: {formatCurrency(q.finalPrice)}
                  </p>
                  <p className="text-[11px] text-[#64748B]">
                    {q.paymentMilestones?.length || 0} Milestone Schedule Stages
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <StatusBadge status={q.status} />
                  <p className="text-[10px] text-[#94A3B8]">{formatDate(q.createdAt)}</p>
                </div>
              </div>
            ))}
            {(!buyer.quotations || buyer.quotations.length === 0) && (
              <div className="py-8 text-center space-y-2">
                <p className="text-xs text-[#94A3B8]">No quotations generated for this buyer yet.</p>
                <button
                  onClick={() => router.push("/quotations")}
                  className="text-xs font-semibold text-[#2563EB] hover:underline"
                >
                  Create quotation in Quotations module →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-[#172033]">Purchase Orders</h2>
          <div className="space-y-3">
            {(buyer.purchaseOrders || []).map((po: BuyerPO) => (
              <div
                key={po.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-[#E2E8F0]"
              >
                <div>
                  <p className="font-mono text-xs font-bold text-[#2563EB]">{po.poNumber}</p>
                  <p className="text-xs font-medium text-[#172033] mt-0.5">
                    Unit: {po.unit?.unitNumber} • Amount: {formatCurrency(po.finalAmount)}
                  </p>
                </div>
                <StatusBadge status={po.status} />
              </div>
            ))}
            {(!buyer.purchaseOrders || buyer.purchaseOrders.length === 0) && (
              <p className="py-8 text-center text-xs text-[#94A3B8]">No Purchase Orders generated.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "kyc" && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#172033]">KYC & Compliance Documents</h2>
              <p className="text-xs text-[#64748B]">
                Checklist items required for AML & Land Department registration
              </p>
            </div>
            <button
              onClick={() => router.push("/onboarding")}
              className="text-xs text-[#2563EB] font-semibold hover:underline"
            >
              Open Full Reviewer Workspace →
            </button>
          </div>

          <div className="space-y-2.5">
            {(buyer.onboarding?.checklistItems || []).map((item: BuyerChecklistItem) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]/50"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-[#2563EB]" />
                  <div>
                    <p className="text-xs font-semibold text-[#172033]">{item.documentName}</p>
                    <p className="text-[10px] text-[#94A3B8]">
                      {item.isRequired ? "Mandatory Document" : "Optional"}
                    </p>
                  </div>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
            {(!buyer.onboarding?.checklistItems || buyer.onboarding.checklistItems.length === 0) && (
              <p className="py-8 text-center text-xs text-[#94A3B8]">
                Checklist items will generate automatically when onboarding begins.
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === "activities" && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-[#172033]">Interaction Timeline</h2>
          <div className="space-y-3">
            {(buyer.activities || []).map((act: BuyerActivity) => (
              <div
                key={act.id}
                className="flex items-start gap-3 p-3 rounded-xl border border-[#F1F5F9] bg-[#F8FAFC]/50"
              >
                <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-[#2563EB]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#172033]">{act.subject}</p>
                    <span className="text-[10px] text-[#94A3B8]">{formatDate(act.createdAt)}</span>
                  </div>
                  {act.description && (
                    <p className="text-xs text-[#64748B] mt-0.5">{act.description}</p>
                  )}
                  <p className="text-[10px] text-[#94A3B8] mt-1">
                    By {act.createdBy.firstName} {act.createdBy.lastName} ({act.type})
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
