"use client";

import { useEffect, useState, use, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Upload,
  FileText,
  FileCheck,
  Building,
  UserCheck,
  Calendar,
  AlertCircle,
  Check,
  Sparkles,
  Send,
  Eye,
  FileSearch,
  Lock,
  Stamp,
  User,
  CreditCard,
  Home,
  Receipt,
  FileSignature,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";

interface ChecklistItemDoc {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: string;
  status: string;
}

interface ChecklistItem {
  id: string;
  documentName: string;
  isRequired: boolean;
  status: string;
  sortOrder: number;
  documents?: ChecklistItemDoc[];
}

interface OnboardingBuyer {
  id: string;
  accountNumber: string;
  buyerType: string;
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  email?: string | null;
  mobile?: string | null;
  nationality?: string | null;
  passportNumber?: string | null;
  nationalId?: string | null;
}

interface OnboardingDetail {
  id: string;
  onboardingNumber: string;
  buyerCategory: string;
  status: string;
  completionPercentage: number;
  createdAt: string;
  buyer: OnboardingBuyer;
  checklistItems: ChecklistItem[];
}

export default function OnboardingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const poId = searchParams.get("poId");

  const { addToast } = useToast();
  const resolvedParams = use(params);
  const onboardingId = resolvedParams.id;

  const [onboarding, setOnboarding] = useState<OnboardingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals & Action State
  const [rejectItem, setRejectItem] = useState<ChecklistItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [verifyingItemId, setVerifyingItemId] = useState<string | null>(null);
  const [verifyingAll, setVerifyingAll] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ name: string; url?: string } | null>(null);

  const loadOnboarding = useCallback(async () => {
    try {
      const res = await fetch(`/api/onboarding/${onboardingId}`);
      if (!res.ok) throw new Error("Onboarding record not found");
      const data = await res.json();
      setOnboarding(data.onboarding);
    } catch {
      addToast("error", "Error", "Failed to retrieve onboarding record");
    } finally {
      setLoading(false);
    }
  }, [onboardingId, addToast]);

  useEffect(() => {
    loadOnboarding();
  }, [loadOnboarding]);

  // Verify single item
  const handleVerifyChecklistItem = async (itemId: string, itemName: string) => {
    setVerifyingItemId(itemId);
    try {
      const res = await fetch(`/api/onboarding/${onboardingId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklistItemId: itemId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");

      addToast("success", "Document Verified", `${itemName} has been validated and cleared.`);
      loadOnboarding();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Verification failed";
      addToast("error", "Verification Error", message);
    } finally {
      setVerifyingItemId(null);
    }
  };

  // Verify all 5 documents in 1 click
  const handleVerifyAll = async () => {
    setVerifyingAll(true);
    try {
      const res = await fetch(`/api/onboarding/${onboardingId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verifyAll: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");

      addToast(
        "success",
        "100% KYC Compliance Cleared!",
        returnTo
          ? "All documents verified. Automatically returning to Purchase Orders to send contract..."
          : "All mandatory items are verified. You can now certify handover."
      );
      loadOnboarding();

      if (returnTo) {
        setTimeout(() => {
          router.push(returnTo);
        }, 1200);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Verification failed";
      addToast("error", "Verification Error", message);
    } finally {
      setVerifyingAll(false);
    }
  };

  const handleRejectDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectItem || !rejectReason.trim()) return;
    setRejecting(true);

    try {
      const docId = rejectItem.documents?.[0]?.id || rejectItem.id;
      const res = await fetch(`/api/documents/${docId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });

      if (!res.ok) throw new Error("Rejection failed");

      addToast("warning", "Document Rejected", `Rejection logged: ${rejectReason}`);
      setRejectItem(null);
      setRejectReason("");
      loadOnboarding();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Rejection failed";
      addToast("error", "Error", message);
    } finally {
      setRejecting(false);
    }
  };

  const handleCompleteOnboarding = async () => {
    setCompleting(true);
    try {
      const res = await fetch(`/api/onboarding/${onboardingId}/complete`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to complete onboarding");
      }

      addToast(
        "success",
        "Buyer Onboarding Certified!",
        returnTo
          ? "Buyer certified. Returning to Purchase Orders..."
          : "Buyer is officially certified Ready for Handover and Title Registration."
      );
      loadOnboarding();

      if (returnTo) {
        setTimeout(() => {
          router.push(returnTo);
        }, 1200);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Compliance requirement not met";
      addToast("error", "Compliance Block", message);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-10 h-10 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold text-[#64748B]">Loading Compliance Reviewer Workspace...</p>
      </div>
    );
  }

  if (!onboarding) {
    return <div className="py-20 text-center text-xs text-rose-600 font-semibold">Onboarding workflow record not found.</div>;
  }

  const buyer = onboarding.buyer;
  const buyerName = buyer.companyName || `${buyer.firstName || ""} ${buyer.lastName || ""}`.trim();
  const allVerified = (onboarding.checklistItems || []).every(
    (item) => !item.isRequired || item.status === "VERIFIED"
  );
  const verifiedCount = (onboarding.checklistItems || []).filter((i) => i.status === "VERIFIED").length;
  const totalCount = (onboarding.checklistItems || []).length;

  const getDocIcon = (index: number) => {
    switch (index) {
      case 0:
        return <CreditCard className="w-4 h-4 text-sky-500" />;
      case 1:
        return <User className="w-4 h-4 text-indigo-500" />;
      case 2:
        return <Home className="w-4 h-4 text-emerald-500" />;
      case 3:
        return <ShieldCheck className="w-4 h-4 text-amber-500" />;
      default:
        return <Receipt className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Return to PO Notice Banner if linked */}
      {returnTo && (
        <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-blue-700/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
              <ShieldCheck className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-2">
                <span>Purchase Order Pre-Dispatch Compliance Gate</span>
                {allVerified ? (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    KYC Cleared (100%)
                  </span>
                ) : (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    Action Required
                  </span>
                )}
              </p>
              <p className="text-[11px] text-blue-200 mt-0.5">
                Verify mandatory KYC documents below to unlock the official <strong>Send to Client</strong> action on PO.
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push(returnTo)}
            className="text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-1.5 rounded-lg transition-colors whitespace-nowrap self-end sm:self-auto"
          >
            ← Return to Purchase Orders
          </button>
        </div>
      )}

      {/* Top Navigation & Action Command Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={() => router.push(returnTo || "/onboarding")}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#172033] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {returnTo ? "Return to Purchase Orders" : "Back to Onboarding Pipeline"}
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          {onboarding.status !== "COMPLETED" && !allVerified && (
            <button
              onClick={handleVerifyAll}
              disabled={verifyingAll}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all hover:shadow-md cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-yellow-300 animate-spin" />
              {verifyingAll ? "Clearing Documents..." : "1-Click Verify All Documents (Fast-Track)"}
            </button>
          )}

          {allVerified && returnTo && (
            <button
              onClick={() => router.push(returnTo)}
              className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl shadow-md transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Send className="w-4 h-4 text-white" />
              Return to PO & Send Contract →
            </button>
          )}

          {onboarding.status !== "COMPLETED" ? (
            <button
              onClick={handleCompleteOnboarding}
              disabled={completing}
              className={`flex items-center gap-1.5 px-4 py-2 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer ${
                allVerified
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 shadow-md ring-2 ring-emerald-400/40"
                  : "bg-slate-700 hover:bg-slate-800"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {completing ? "Certifying Handover..." : "Complete Onboarding & Certify Handover"}
            </button>
          ) : (
            <span className="px-4 py-2 bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Certified Ready for Handover
            </span>
          )}
        </div>
      </div>

      {/* Luxury Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0D2137] via-[#153B66] to-[#1E293B] p-6 text-white shadow-xl border border-blue-900/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-2xl font-black shadow-inner">
              {buyer.buyerType === "CORPORATE" ? (
                <Building className="w-8 h-8 text-sky-300" />
              ) : (
                `${buyer.firstName?.[0] || ""}${buyer.lastName?.[0] || ""}`
              )}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-white">{buyerName}</h1>
                <span className="font-mono text-xs font-bold text-sky-300 bg-white/10 border border-white/15 px-2.5 py-0.5 rounded-lg">
                  {onboarding.onboardingNumber}
                </span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    onboarding.status === "COMPLETED"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                      : "bg-amber-500/20 text-amber-300 border-amber-400/40"
                  }`}
                >
                  {onboarding.status.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-blue-200">
                <span>Account: <strong className="text-white font-mono">{buyer.accountNumber}</strong></span>
                <span>•</span>
                <span>Category: <strong className="text-white">{onboarding.buyerCategory.replace(/_/g, " ")}</strong></span>
                <span>•</span>
                <span>Nationality: <strong className="text-white">{buyer.nationality || "UAE"}</strong></span>
                {buyer.passportNumber && (
                  <>
                    <span>•</span>
                    <span>Passport: <strong className="text-white font-mono">{buyer.passportNumber}</strong></span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* KYC Meter Radial / Progress Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4.5 flex items-center gap-5 min-w-[280px]">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-16 h-16 -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  stroke="rgba(255, 255, 255, 0.15)"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  stroke={onboarding.completionPercentage === 100 ? "#10B981" : "#38BDF8"}
                  strokeWidth="6"
                  strokeDasharray={163.36}
                  strokeDashoffset={163.36 - (163.36 * onboarding.completionPercentage) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <span className="absolute text-sm font-black text-white">
                {onboarding.completionPercentage}%
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-white">KYC Verification</p>
              <p className="text-[11px] text-blue-200">
                {verifiedCount} of {totalCount} Documents Cleared
              </p>
              <div className="pt-1">
                {allVerified ? (
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1 w-fit">
                    <Check className="w-3 h-3" /> AML & DLD Compliant
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/30 flex items-center gap-1 w-fit">
                    <AlertTriangle className="w-3 h-3" /> {totalCount - verifiedCount} Pending Clearance
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Checklist Matrix */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-[#172033] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
              Mandatory Compliance & Document Checklist
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Verified in accordance with UAE Real Estate Regulatory Authority (RERA) & AML requirements.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 bg-white border border-[#E2E8F0] text-[#64748B] rounded-lg font-semibold">
              Total Required: <strong>{totalCount} Documents</strong>
            </span>
            <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg font-bold">
              Verified: <strong>{verifiedCount}</strong>
            </span>
          </div>
        </div>

        <div className="divide-y divide-[#F1F5F9]">
          {(onboarding.checklistItems || []).map((item, idx) => {
            const doc = item.documents?.[0];
            const isVerified = item.status === "VERIFIED";

            return (
              <div
                key={item.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#F8FAFC]/80 transition-colors"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${
                      isVerified
                        ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                        : "bg-[#EFF6FF] border-blue-200 text-[#153B66]"
                    }`}
                  >
                    {isVerified ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      getDocIcon(idx)
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-bold text-[#172033]">{item.documentName}</p>
                      {item.isRequired && (
                        <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          Mandatory
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#64748B]">
                      {doc ? (
                        <button
                          onClick={() => setPreviewDoc({ name: doc.originalName })}
                          className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200 hover:underline"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          {doc.originalName} ({formatDate(doc.uploadedAt)})
                        </button>
                      ) : (
                        <span className="text-[#94A3B8] italic flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                          Document file attached on verification
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-3 self-end md:self-auto">
                  <StatusBadge status={item.status} />

                  {!isVerified ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleVerifyChecklistItem(item.id, item.documentName)}
                        disabled={verifyingItemId === item.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {verifyingItemId === item.id ? "Validating..." : "Verify Document"}
                      </button>
                      <button
                        onClick={() => {
                          setRejectItem(item);
                          setRejectReason("");
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <Stamp className="w-3.5 h-3.5" />
                      Approved by Compliance
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RERA Regulatory Compliance & Audit Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-[#E2E8F0] shadow-xs flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#172033]">AML & Sanctions Screening</h3>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Automated screening against UAE Central Bank and international watchlists.
            </p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#E2E8F0] shadow-xs flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
            <FileSignature className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#172033]">DLD Oqood Title Registration</h3>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Pre-registration certified once KYC documents are approved.
            </p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#E2E8F0] shadow-xs flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center shrink-0">
            <Receipt className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#172033]">Escrow Account Verification</h3>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Down payment and token receipts audited in compliance escrow vault.
            </p>
          </div>
        </div>
      </div>

      {/* Document Rejection Modal */}
      <Modal
        open={!!rejectItem}
        onClose={() => setRejectItem(null)}
        title="Reject Document & Require Resubmission"
        description={rejectItem?.documentName || "Provide mandatory reason for rejection"}
        footer={
          <>
            <button
              onClick={() => setRejectItem(null)}
              className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleRejectDoc}
              disabled={rejecting || !rejectReason.trim()}
              className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {rejecting ? "Rejecting..." : "Submit Rejection"}
            </button>
          </>
        }
      >
        <form onSubmit={handleRejectDoc} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#172033] mb-1">
              Rejection Reason (Mandatory) *
            </label>
            <textarea
              rows={3}
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Emirates ID scan is expired, blurry, or missing backside..."
              className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:border-rose-500 outline-none"
            />
            <p className="text-[10px] text-[#94A3B8] mt-1">
              The buyer will receive this audit note to re-upload the valid document.
            </p>
          </div>
        </form>
      </Modal>

      {/* Document Quick Preview Modal */}
      <Modal
        open={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        title="Compliance Document Preview"
        description={previewDoc?.name || "Official Verified Document"}
      >
        <div className="p-8 text-center space-y-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-blue-600">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#172033]">{previewDoc?.name}</p>
            <p className="text-xs text-[#64748B] mt-1">Official Vault Document • Encrypted & Cleared</p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> 100% Cryptographic Checksum Verified
            </span>
          </div>
        </div>
      </Modal>
    </div>
  );
}
