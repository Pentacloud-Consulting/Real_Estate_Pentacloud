"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  CheckCircle2,
  FileCheck,
  Building,
  UserCheck,
  ShieldCheck,
  AlertCircle,
  Eye,
  Plus,
  Printer,
  Send,
  FileText,
  BadgeCheck,
} from "lucide-react";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatCurrency } from "@/lib/utils";

interface POItem {
  id: string;
  poNumber: string;
  unitPrice: number;
  finalAmount: number;
  downPayment: number;
  paymentPlan: string;
  purchaseDate: string;
  status: string;
  confirmedAt: string | null;
  buyer: {
    id: string;
    firstName: string;
    lastName: string;
    companyName: string;
    accountNumber: string;
    buyerType: string;
    email?: string;
    mobile?: string;
    nationality?: string;
    onboarding?: { id: string; status: string; completionPercentage: number } | null;
  };
  project: { id: string; name: string; code: string; developer?: string; location?: string };
  unit: { id: string; unitNumber: string; status: string; unitType?: string; bedrooms?: number; area?: number };
  approvedBy: { firstName: string; lastName: string } | null;
}

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [orders, setOrders] = useState<POItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  // Active Preview for Formal PO Contract PDF
  const [activePreview, setActivePreview] = useState<POItem | null>(null);

  // New PO Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Data for creation dropdowns
  const [buyers, setBuyers] = useState<any[]>([]);
  const [eois, setEois] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);

  const [form, setForm] = useState({
    buyerId: "",
    projectId: "",
    unitId: "",
    eoiId: "",
    quotationId: "",
    unitPrice: 0,
    discount: 0,
    additionalCharges: 0,
    finalAmount: 0,
    downPayment: 200000,
    paymentPlan: "Construction Linked 60/40",
  });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/purchase-orders");
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      addToast("error", "Error", "Failed to load purchase orders");
    } finally {
      setLoading(false);
    }
  };

  const loadDependencies = async () => {
    try {
      const [bRes, eRes, qRes, uRes] = await Promise.all([
        fetch("/api/buyers"),
        fetch("/api/eois"),
        fetch("/api/quotations"),
        fetch("/api/units"),
      ]);
      const bData = await bRes.json();
      const eData = await eRes.json();
      const qData = await qRes.json();
      const uData = await uRes.json();

      setBuyers(bData.buyers || []);
      setEois((eData.eois || []).filter((e: any) => e.paymentStatus === "VERIFIED"));
      setQuotations(qData.quotations || []);
      setUnits(uData.units || []);
    } catch (err) {
      console.error("Failed to load PO dependencies", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    loadDependencies();
  }, []);

  const handleSelectEOI = (eoiId: string) => {
    const selected = eois.find((e) => e.id === eoiId);
    if (!selected) return;

    const price = selected.unitPrice || selected.unit?.finalPrice || 0;
    setForm({
      buyerId: selected.buyer?.id || "",
      projectId: selected.project?.id || "",
      unitId: selected.unit?.id || "",
      eoiId: selected.id,
      quotationId: "",
      unitPrice: price,
      discount: 0,
      additionalCharges: 0,
      finalAmount: price,
      downPayment: selected.tokenAmount || 200000,
      paymentPlan: "Construction Linked 60/40",
    });
  };

  const handleSelectQuotation = (quotationId: string) => {
    const selected = quotations.find((q) => q.id === quotationId);
    if (!selected) return;

    setForm({
      buyerId: selected.buyerId || "",
      projectId: selected.projectId || "",
      unitId: selected.unitId || "",
      eoiId: selected.eoiId || "",
      quotationId: selected.id,
      unitPrice: selected.basePrice || selected.finalPrice,
      discount: selected.discount || 0,
      additionalCharges: (selected.floorPremium || 0) + (selected.viewPremium || 0),
      finalAmount: selected.finalPrice,
      downPayment: Math.round(selected.finalPrice * 0.1),
      paymentPlan: "Milestone Linked 100%",
    });
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.buyerId || !form.unitId || !form.projectId) {
      addToast("error", "Error", "Please select buyer, project, and unit");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          unitPrice: Number(form.unitPrice),
          finalAmount: Number(form.finalAmount),
          downPayment: Number(form.downPayment),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create Purchase Order");

      addToast(
        "success",
        "Purchase Order Generated!",
        `PO #${data.po.poNumber} created. You can now preview the formal contract and send to client.`
      );
      setShowCreateModal(false);
      fetchOrders();
    } catch (err: any) {
      addToast("error", "Error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Send PO to Client
  const handleSendToClient = async (po: POItem) => {
    setSendingId(po.id);
    try {
      const res = await fetch(`/api/purchase-orders/${po.id}/send`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send PO");

      addToast(
        "success",
        "Purchase Order Sent to Client!",
        `Contract #${po.poNumber} dispatched via secure investor portal & email.`
      );
      fetchOrders();
      if (activePreview?.id === po.id) {
        setActivePreview({ ...activePreview, status: "SENT" });
      }
    } catch (err: any) {
      addToast("error", "Error Sending PO", err.message);
    } finally {
      setSendingId(null);
    }
  };

  const handleConfirmSale = async (id: string, poNumber: string, unitNumber: string) => {
    if (!confirm(`Confirm final sale for PO ${poNumber} (Unit ${unitNumber})? This will permanently update the unit to SOLD, mark the opportunity as CLOSED WON, and generate the buyer KYC onboarding workflow.`)) return;
    setConfirmingId(id);

    try {
      const res = await fetch(`/api/purchase-orders/${id}/confirm`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Confirmation failed");

      addToast(
        "success",
        "Sale Confirmed & Unit Marked SOLD!",
        `Buyer onboarding checklist initiated (#${data.onboarding.onboardingNumber}).`
      );
      fetchOrders();
      router.push(`/onboarding/${data.onboarding.id}`);
    } catch (err: any) {
      addToast("error", "Error", err.message);
    } finally {
      setConfirmingId(null);
    }
  };

  const columns: Column<POItem>[] = [
    {
      key: "poNumber",
      label: "PO Reference",
      sortable: true,
      render: (item) => (
        <span className="font-mono text-xs font-bold text-[#2563EB]">
          {item.poNumber}
        </span>
      ),
    },
    {
      key: "buyer",
      label: "Purchaser / Entity",
      render: (item) => (
        <div>
          <p className="font-semibold text-xs text-[#172033]">
            {item.buyer?.companyName || `${item.buyer?.firstName} ${item.buyer?.lastName}`}
          </p>
          <span className="text-[10px] text-[#64748B] font-mono">{item.buyer?.accountNumber}</span>
        </div>
      ),
    },
    {
      key: "unit",
      label: "Unit Allocation",
      render: (item) => (
        <div>
          <span className="font-mono text-xs font-bold text-[#153B66]">
            {item.unit?.unitNumber}
          </span>
          <p className="text-[10px] text-[#64748B]">{item.project?.name}</p>
        </div>
      ),
    },
    {
      key: "finalAmount",
      label: "Total Sales Value",
      render: (item) => (
        <span className="text-xs font-bold text-emerald-700">
          {formatCurrency(item.finalAmount)}
        </span>
      ),
    },
    {
      key: "downPayment",
      label: "Down Payment",
      render: (item) => (
        <span className="text-xs font-medium text-[#172033]">
          {formatCurrency(item.downPayment)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Contract Status",
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "kyc",
      label: "KYC Compliance",
      render: (item) => {
        const onboarding = item.buyer?.onboarding;
        const isKycCleared = onboarding?.completionPercentage === 100 || onboarding?.status === "COMPLETED";

        return (
          <div>
            {isKycCleared ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                KYC Cleared (100%)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <AlertCircle className="w-3 h-3 text-amber-600" />
                KYC Incomplete ({onboarding?.completionPercentage ?? 0}%)
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "purchaseDate",
      label: "Date",
      render: (item) => (
        <span className="text-xs text-[#64748B]">{formatDate(item.purchaseDate)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
            Purchase Orders & Sale Confirmations
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Formal property sale agreements, down-payment verification, unit sale finalization, and automatic onboarding dispatch
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Purchase Order
        </button>
      </div>

      <DataTable
        data={orders}
        columns={columns}
        loading={loading}
        emptyMessage="No purchase orders generated."
        actions={(item) => {
          const onboarding = item.buyer?.onboarding;
          const isKycCleared = onboarding?.completionPercentage === 100 || onboarding?.status === "COMPLETED";
          const onboardingId = onboarding?.id;

          return (
            <div className="flex items-center justify-end gap-1.5">
              {/* Formal PDF Contract View Button */}
              <button
                onClick={() => setActivePreview(item)}
                className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded-md text-[11px] font-semibold text-slate-700 transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                Formal PO PDF
              </button>

              {/* Requirement: If KYC is incomplete, enforce verification before dispatching to client */}
              {!isKycCleared && item.status !== "CONFIRMED" && item.status !== "CLOSED_WON" && (
                <button
                  onClick={() =>
                    router.push(
                      onboardingId
                        ? `/onboarding/${onboardingId}?returnTo=/purchase-orders&poId=${item.id}`
                        : `/onboarding`
                    )
                  }
                  className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-md text-[11px] font-semibold transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  Verify KYC First →
                </button>
              )}

              {/* Step 2: Once KYC is 100% Cleared, ONLY "Send PO to Client" is available */}
              {isKycCleared && item.status !== "CONFIRMED" && item.status !== "CLOSED_WON" && item.status !== "SENT" && (
                <button
                  onClick={() => handleSendToClient(item)}
                  disabled={sendingId === item.id}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold transition-colors shadow-xs disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {sendingId === item.id ? "Sending..." : "Send PO to Client"}
                </button>
              )}

              {/* Step 3: Only AFTER sending PO to client does "Confirm Sale & Mark Unit SOLD" become available */}
              {item.status === "SENT" && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-blue-700 font-semibold px-2 py-0.5 bg-blue-50 rounded-md border border-blue-200">
                    Dispatched
                  </span>
                  <button
                    onClick={() => handleConfirmSale(item.id, item.poNumber, item.unit?.unitNumber || "Unit")}
                    disabled={confirmingId === item.id}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                  >
                    {confirmingId === item.id ? "Confirming..." : "Confirm Sale & Mark Unit SOLD"}
                  </button>
                </div>
              )}

              {(item.status === "CONFIRMED" || item.status === "CLOSED_WON") && (
                <button
                  onClick={() => router.push(onboardingId ? `/onboarding/${onboardingId}` : `/onboarding`)}
                  className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-md text-xs font-semibold transition-colors"
                >
                  Go to Onboarding →
                </button>
              )}
            </div>
          );
        }}
      />

      {/* Create Purchase Order Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Purchase Order"
        description="Select verified reservation or approved quotation to formalize purchase agreement"
        size="lg"
        footer={
          <>
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleCreatePO}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold bg-[#153B66] hover:bg-[#102C4C] text-white rounded-lg shadow-xs"
            >
              {submitting ? "Issuing PO..." : "Issue Purchase Order"}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreatePO} className="space-y-4 text-xs">
          {eois.length > 0 && (
            <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg">
              <label className="block text-xs font-semibold text-[#1E40AF] mb-1">
                Option A: Fast Import from Verified EOI / Reservation
              </label>
              <select
                value={form.eoiId}
                onChange={(e) => handleSelectEOI(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#BFDBFE] rounded-lg bg-white"
              >
                <option value="">-- Choose verified EOI / Reservation --</option>
                {eois.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.eoiNumber} — {e.buyer?.firstName} {e.buyer?.lastName} ({e.buyer?.companyName || e.buyer?.accountNumber}) | Unit {e.unit?.unitNumber} ({formatCurrency(e.unitPrice || e.unit?.finalPrice)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {quotations.length > 0 && (
            <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg">
              <label className="block text-xs font-semibold text-[#166534] mb-1">
                Option B: Import from Approved Quotation
              </label>
              <select
                value={form.quotationId}
                onChange={(e) => handleSelectQuotation(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#BBF7D0] rounded-lg bg-white"
              >
                <option value="">-- Choose Quotation --</option>
                {quotations.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.quotationNumber} — {q.buyer?.firstName} {q.buyer?.lastName} | Unit {q.unit?.unitNumber} ({formatCurrency(q.finalPrice)})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">
                Buyer Account *
              </label>
              <select
                required
                value={form.buyerId}
                onChange={(e) => setForm({ ...form, buyerId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-white"
              >
                <option value="">-- Select Buyer --</option>
                {buyers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.accountNumber} — {b.companyName || `${b.firstName} ${b.lastName}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">
                Allocated Property Unit *
              </label>
              <select
                required
                value={form.unitId}
                onChange={(e) => {
                  const u = units.find((x) => x.id === e.target.value);
                  setForm({
                    ...form,
                    unitId: e.target.value,
                    projectId: u?.projectId || form.projectId,
                    unitPrice: u?.finalPrice || 0,
                    finalAmount: u?.finalPrice || 0,
                  });
                }}
                className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-white"
              >
                <option value="">-- Select Unit --</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    Unit {u.unitNumber} ({u.unitType}) — {formatCurrency(u.finalPrice)} [{u.status}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">
                Total Contract Sales Value (AED) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={form.finalAmount}
                onChange={(e) =>
                  setForm({ ...form, finalAmount: Number(e.target.value), unitPrice: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">
                Down Payment / Token Credited (AED) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={form.downPayment}
                onChange={(e) => setForm({ ...form, downPayment: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg font-mono"
              />
            </div>
          </div>

          {/* Dynamic Financial Summary Card */}
          {(() => {
            const total = Number(form.finalAmount || 0);
            const credited = Number(form.downPayment || 0);
            const remaining = Math.max(0, total - credited);

            return (
              <div className="p-3.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between text-[#64748B]">
                  <span>Total Purchase Contract Value:</span>
                  <span className="font-semibold text-[#172033] font-mono">{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span className="font-semibold">Deposit / Token Credited:</span>
                  <span className="font-bold font-mono">- {formatCurrency(credited)}</span>
                </div>
                <div className="pt-2 border-t border-[#BFDBFE] flex justify-between items-center">
                  <span className="font-bold text-[#1E40AF]">Remaining Balance over Construction / Handover:</span>
                  <span className="font-bold text-sm text-[#1E40AF] font-mono">
                    {formatCurrency(remaining)}
                  </span>
                </div>
              </div>
            );
          })()}

          <div>
            <label className="block text-xs font-semibold text-[#172033] mb-1">
              Payment Plan Structure
            </label>
            <select
              value={form.paymentPlan}
              onChange={(e) => setForm({ ...form, paymentPlan: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-white"
            >
              <option value="Construction Linked 60/40">Construction Linked 60/40</option>
              <option value="Milestone 50/50 Post-Handover">Milestone 50/50 Post-Handover</option>
              <option value="Cash 100% Upfront Discounted">Cash 100% Upfront Discounted</option>
              <option value="Standard 80/20 Escrow Schedule">Standard 80/20 Escrow Schedule</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Formal PO Contract PDF Preview Modal */}
      <Modal
        open={!!activePreview}
        onClose={() => setActivePreview(null)}
        title={`Purchase Order Contract: ${activePreview?.poNumber}`}
        description="Official Property Sale & Purchase Agreement (SPA Offer)"
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-[#64748B]">
              Registered under UAE Real Estate Regulatory Agency (RERA) Escrow Framework
            </span>
            <div className="flex items-center gap-2">
              {activePreview && activePreview.status !== "CONFIRMED" && activePreview.status !== "CLOSED_WON" && activePreview.status !== "SENT" && (
                <button
                  onClick={() => handleSendToClient(activePreview)}
                  disabled={sendingId === activePreview.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB] text-white text-xs font-semibold rounded-lg hover:bg-[#1D4ED8]"
                >
                  <Send className="w-3.5 h-3.5" />
                  {sendingId === activePreview.id ? "Sending..." : "Send Contract to Client"}
                </button>
              )}
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#153B66] text-white text-xs font-semibold rounded-lg hover:bg-[#102C4C]"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Save PDF
              </button>
            </div>
          </div>
        }
      >
        {activePreview && (
          <div className="p-6 bg-white border border-[#E2E8F0] rounded-xl space-y-6 text-xs text-[#172033]">
            {/* Developer Letterhead */}
            <div className="flex items-start justify-between pb-4 border-b border-[#E2E8F0]">
              <div>
                <h1 className="text-lg font-bold text-[#102C4C]">PENTACLOUD PROPERTIES DEVELOPMENTS LLC</h1>
                <p className="text-[10px] text-[#64748B]">
                  Official Real Estate Sales & Escrow Management Office
                </p>
                <p className="text-[10px] text-[#64748B]">DIFC Gate Tower 4, Suite 1200, Dubai, United Arab Emirates</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-sm font-bold text-[#2563EB]">
                  {activePreview.poNumber}
                </span>
                <p className="text-[10px] text-[#94A3B8] mt-0.5">
                  Contract Date: {formatDate(activePreview.purchaseDate)}
                </p>
                <span className="inline-block mt-1">
                  <StatusBadge status={activePreview.status} />
                </span>
              </div>
            </div>

            {/* Buyer & Property Grid */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <div>
                <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">
                  Purchaser / Investor Entity
                </span>
                <p className="font-bold text-xs mt-1 text-[#172033]">
                  {activePreview.buyer?.companyName || `${activePreview.buyer?.firstName} ${activePreview.buyer?.lastName}`}
                </p>
                <p className="text-[#64748B] text-[10px] font-mono mt-0.5">
                  Account ID: {activePreview.buyer?.accountNumber} ({activePreview.buyer?.buyerType})
                </p>
                <p className="text-[#64748B] text-[10px]">
                  Nationality: {activePreview.buyer?.nationality || "UAE Resident"}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">
                  Property Unit Allocation
                </span>
                <p className="font-bold text-xs mt-1 text-[#153B66]">
                  Unit {activePreview.unit?.unitNumber} • {activePreview.project?.name}
                </p>
                <p className="text-[#64748B] text-[10px] mt-0.5">
                  Type: {activePreview.unit?.unitType || "Luxury Apartment"} • Project Code: {activePreview.project?.code}
                </p>
                <p className="text-[#64748B] text-[10px]">
                  Inventory State: <span className="font-semibold text-emerald-700">{activePreview.unit?.status}</span>
                </p>
              </div>
            </div>

            {/* Commercial Terms Table */}
            <div className="space-y-1.5">
              <p className="font-bold uppercase tracking-wider text-[10px] text-[#64748B]">
                Financial Terms & Contract Consideration
              </p>
              <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-[#E2E8F0]">
                    <tr>
                      <td className="px-3 py-2 text-[#64748B]">Gross Unit Purchase Price</td>
                      <td className="px-3 py-2 text-right font-medium">
                        {formatCurrency(activePreview.unitPrice || activePreview.finalAmount)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 text-emerald-700 font-medium">
                        Down Payment / Token Advance Credited
                      </td>
                      <td className="px-3 py-2 text-right text-emerald-700 font-bold">
                        - {formatCurrency(activePreview.downPayment)}
                      </td>
                    </tr>
                    <tr className="bg-[#F8FAFC] font-bold">
                      <td className="px-3 py-2.5 text-[#102C4C] text-sm">Total Contract Consideration</td>
                      <td className="px-3 py-2.5 text-right text-sm text-[#2563EB]">
                        {formatCurrency(activePreview.finalAmount)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 text-[#64748B]">Agreed Payment Plan Structure</td>
                      <td className="px-3 py-2 text-right font-medium text-[#172033]">
                        {activePreview.paymentPlan || "Construction Linked 60/40"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Legal Covenants */}
            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] text-[10px] text-[#64748B] space-y-1">
              <p className="font-bold text-[#172033] uppercase">Governing Covenants:</p>
              <p>
                1. This Purchase Order agreement constitutes an official contract offer for property reservation and acquisition under Dubai Land Department regulations.
              </p>
              <p>
                2. All advance deposits are held strictly within an approved RERA Project Escrow Account.
              </p>
              <p>
                3. Title Deed registration and key handover will be executed upon completion of buyer KYC compliance and final payment clearance.
              </p>
            </div>

            {/* Formal Signature Blocks */}
            <div className="grid grid-cols-2 gap-8 pt-4 border-t border-[#E2E8F0]">
              <div className="space-y-2">
                <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">
                  For PentaCloud Properties Developments LLC
                </span>
                <div className="h-14 border border-dashed border-[#CBD5E1] rounded-lg flex items-center justify-center bg-[#F8FAFC]">
                  <span className="font-serif italic text-sm text-[#102C4C] font-semibold">
                    Ahmed Al Rashid (Authorized Signatory)
                  </span>
                </div>
                <p className="text-[9px] text-[#94A3B8]">Super Admin & Corporate Authorized Officer</p>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">
                  For the Purchaser / Investor
                </span>
                <div className="h-14 border border-dashed border-[#CBD5E1] rounded-lg flex items-center justify-center bg-[#F8FAFC]">
                  <span className="font-serif italic text-sm text-[#2563EB] font-semibold">
                    {activePreview.buyer?.companyName || `${activePreview.buyer?.firstName} ${activePreview.buyer?.lastName}`}
                  </span>
                </div>
                <p className="text-[9px] text-[#94A3B8]">
                  {activePreview.status === "CONFIRMED" ? "Digitally Executed & Bound" : "Digital Acceptance via Secure Portal"}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
