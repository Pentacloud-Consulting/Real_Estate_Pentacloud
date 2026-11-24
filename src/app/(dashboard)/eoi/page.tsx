"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileSignature,
  Plus,
  CheckCircle2,
  Clock,
  ShieldCheck,
  DollarSign,
  Building,
  UserCheck,
  Eye,
  AlertCircle,
  Receipt,
  ShoppingCart,
} from "lucide-react";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatCurrency } from "@/lib/utils";

interface EOIItem {
  id: string;
  eoiNumber: string;
  unitPrice: number;
  tokenAmount: number;
  paymentMethod: string;
  paymentReference: string | null;
  paymentStatus: string;
  status: string;
  eoiDate: string;
  buyer: { id: string; firstName: string; lastName: string; companyName: string; accountNumber: string };
  project: { id: string; name: string; code?: string };
  unit: { id: string; unitNumber: string; finalPrice: number; status: string };
  verifiedBy: { firstName: string; lastName: string } | null;
  reservation: { id: string; reservationNumber: string; expiryDate: string } | null;
}

export default function EOIPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [eois, setEois] = useState<EOIItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  // Direct Quotation Generation Modal
  const [quotationModalEOI, setQuotationModalEOI] = useState<EOIItem | null>(null);
  const [generatingQuotation, setGeneratingQuotation] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Direct PO Generation Modal
  const [poModalEOI, setPoModalEOI] = useState<EOIItem | null>(null);
  const [generatingPO, setGeneratingPO] = useState(false);
  const [poDownPayment, setPoDownPayment] = useState("200000");
  const [poPaymentPlan, setPoPaymentPlan] = useState("Construction Linked 60/40");

  const [form, setForm] = useState({
    buyerId: "",
    unitId: "",
    tokenAmount: "100000",
    paymentMethod: "BANK_TRANSFER",
    paymentReference: "FT-892104",
    preferredPaymentPlan: "Construction Linked 60/40",
    notes: "",
  });

  const fetchEOIs = async () => {
    setLoading(true);
    try {
      const [eoiRes, buyerRes, unitRes] = await Promise.all([
        fetch("/api/eois"),
        fetch("/api/buyers"),
        fetch("/api/units?status=AVAILABLE"),
      ]);

      const eoiData = await eoiRes.json();
      const buyerData = await buyerRes.json();
      const unitData = await unitRes.json();

      setEois(eoiData.eois || []);
      setBuyers(buyerData.buyers || []);
      setUnits(unitData.units || []);
    } catch {
      addToast("error", "Error", "Failed to load EOI records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEOIs();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const selectedUnit = units.find((u) => u.id === form.unitId);
    if (!selectedUnit) {
      addToast("error", "Error", "Please select an available unit");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/eois", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          projectId: selectedUnit.projectId,
          unitPrice: selectedUnit.finalPrice,
          tokenAmount: Number(form.tokenAmount),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");

      addToast("success", "EOI Submitted", `EOI #${data.eoi.eoiNumber} logged. Ready for payment verification.`);
      setShowCreateModal(false);
      fetchEOIs();
    } catch (err: any) {
      addToast("error", "Error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyPayment = async (id: string, eoiNumber: string, unitNumber: string) => {
    if (!confirm(`Confirm escrow verification for EOI ${eoiNumber}? This will activate an atomic reservation lock on Unit ${unitNumber}.`)) return;
    setVerifyingId(id);

    try {
      const res = await fetch(`/api/eois/${id}/verify-payment`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");

      addToast("success", "Payment Verified & Unit Reserved!", `Unit ${unitNumber} is now officially locked with active reservation.`);
      fetchEOIs();
    } catch (err: any) {
      addToast("error", "Verification Error", err.message);
    } finally {
      setVerifyingId(null);
    }
  };

  // Submit Quotation from EOI
  const handleGenerateQuotation = async () => {
    if (!quotationModalEOI) return;
    setGeneratingQuotation(true);

    try {
      const unitPrice = quotationModalEOI.unitPrice || quotationModalEOI.unit.finalPrice;
      const finalPrice = Math.max(0, unitPrice - discountAmount);

      const milestones = [
        { name: "Down Payment on Booking", percentage: 20 },
        { name: "1st Milestone - Foundation Completion", percentage: 20 },
        { name: "2nd Milestone - Superstructure Completion", percentage: 20 },
        { name: "Final Milestone - Handover & Key Release", percentage: 40 },
      ];

      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerId: quotationModalEOI.buyer.id,
          projectId: quotationModalEOI.project.id,
          unitId: quotationModalEOI.unit.id,
          eoiId: quotationModalEOI.id,
          basePrice: unitPrice,
          floorPremium: 0,
          viewPremium: 0,
          otherFees: 0,
          discount: discountAmount,
          tax: 0,
          finalPrice: finalPrice,
          currency: "AED",
          milestones: milestones,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate quotation");

      addToast(
        "success",
        "Quotation Generated Successfully!",
        `Official Quotation #${data.quotation.quotationNumber} created with 100% milestone schedule.`
      );
      setQuotationModalEOI(null);
      router.push("/quotations");
    } catch (err: any) {
      addToast("error", "Quotation Error", err.message);
    } finally {
      setGeneratingQuotation(false);
    }
  };

  // Submit Purchase Order from EOI
  const handleGeneratePO = async () => {
    if (!poModalEOI) return;
    setGeneratingPO(true);

    try {
      const unitPrice = poModalEOI.unitPrice || poModalEOI.unit.finalPrice;
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerId: poModalEOI.buyer.id,
          projectId: poModalEOI.project.id,
          unitId: poModalEOI.unit.id,
          eoiId: poModalEOI.id,
          unitPrice: unitPrice,
          discount: 0,
          additionalCharges: 0,
          finalAmount: unitPrice,
          downPayment: Number(poDownPayment),
          paymentPlan: poPaymentPlan,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate Purchase Order");

      addToast(
        "success",
        "Purchase Order Generated!",
        `PO #${data.po.poNumber} created. You can now confirm the sale and dispatch onboarding.`
      );
      setPoModalEOI(null);
      router.push("/purchase-orders");
    } catch (err: any) {
      addToast("error", "PO Creation Error", err.message);
    } finally {
      setGeneratingPO(false);
    }
  };

  const columns: Column<EOIItem>[] = [
    {
      key: "eoiNumber",
      label: "EOI Reference",
      sortable: true,
      render: (item) => (
        <span className="font-mono text-xs font-bold text-[#2563EB]">
          {item.eoiNumber}
        </span>
      ),
    },
    {
      key: "buyer",
      label: "Buyer / Investor",
      render: (item) => (
        <div>
          <p className="font-semibold text-xs text-[#172033]">
            {item.buyer.companyName || `${item.buyer.firstName} ${item.buyer.lastName}`}
          </p>
          <p className="font-mono text-[10px] text-[#64748B]">{item.buyer.accountNumber}</p>
        </div>
      ),
    },
    {
      key: "unit",
      label: "Allocated Unit",
      render: (item) => (
        <div>
          <span className="font-mono text-xs font-bold text-[#153B66]">
            {item.unit.unitNumber}
          </span>
          <p className="text-[10px] text-[#64748B] truncate max-w-[120px]">{item.project.name}</p>
        </div>
      ),
    },
    {
      key: "tokenAmount",
      label: "Token Amount",
      render: (item) => (
        <span className="text-xs font-bold text-emerald-700">
          {formatCurrency(item.tokenAmount)}
        </span>
      ),
    },
    {
      key: "paymentStatus",
      label: "Deposit Verification",
      render: (item) => <StatusBadge status={item.paymentStatus} />,
    },
    {
      key: "status",
      label: "Workflow State",
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "reservation",
      label: "Active Reservation",
      render: (item) => (
        <div className="text-xs">
          {item.reservation ? (
            <div>
              <span className="font-mono font-semibold text-purple-700 block">
                {item.reservation.reservationNumber}
              </span>
              <span className="text-[10px] text-[#64748B]">
                Expires: {formatDate(item.reservation.expiryDate)}
              </span>
            </div>
          ) : (
            <span className="text-[#94A3B8]">Pending Verification</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSignature className="w-6 h-6 text-blue-600" />
            Expression of Interest (EOI) & Reservations
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Formal unit booking requests, escrow token confirmations, and atomic inventory lock control
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          New EOI Booking
        </button>
      </div>

      <DataTable
        data={eois}
        columns={columns}
        loading={loading}
        emptyMessage="No EOI submissions logged."
        actions={(item) => (
          <div className="flex items-center justify-end gap-1.5">
            {item.paymentStatus === "PENDING" && (
              <button
                onClick={() => handleVerifyPayment(item.id, item.eoiNumber, item.unit.unitNumber)}
                disabled={verifyingId === item.id}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[11px] font-semibold transition-colors shadow-xs"
              >
                {verifyingId === item.id ? "Locking..." : "Verify & Lock Unit"}
              </button>
            )}
            {item.paymentStatus === "VERIFIED" && item.status !== "CONVERTED_TO_PO" && (
              <>
                <button
                  onClick={() => setQuotationModalEOI(item)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-md text-[11px] font-semibold transition-colors"
                >
                  <Receipt className="w-3 h-3 text-blue-600" />
                  Create Quotation
                </button>
                <button
                  onClick={() => {
                    setPoModalEOI(item);
                    setPoDownPayment(String(item.tokenAmount || 200000));
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[11px] font-semibold transition-colors shadow-xs"
                >
                  <ShoppingCart className="w-3 h-3" />
                  Generate PO
                </button>
              </>
            )}
          </div>
        )}
      />

      {/* Create EOI Modal - Clean 2-column layout */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Submit Expression of Interest (EOI)"
        description="Select prospective buyer and available property unit to record token receipt"
        footer={
          <>
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit EOI"}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Select Registered Buyer *
              </label>
              <select
                required
                value={form.buyerId}
                onChange={(e) => setForm({ ...form, buyerId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-blue-600"
              >
                <option value="">-- Choose Buyer Account --</option>
                {buyers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.accountNumber} — {b.companyName || `${b.firstName} ${b.lastName}`} ({b.buyerType})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Select Available Unit *
              </label>
              <select
                required
                value={form.unitId}
                onChange={(e) => setForm({ ...form, unitId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-blue-600"
              >
                <option value="">-- Choose Unit --</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    Unit {u.unitNumber} — {u.unitType} ({formatCurrency(u.finalPrice)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Token Amount (AED) *
              </label>
              <input
                type="number"
                required
                min="1000"
                value={form.tokenAmount}
                onChange={(e) => setForm({ ...form, tokenAmount: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Payment Channel
              </label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-blue-600"
              >
                <option value="BANK_TRANSFER">Bank Wire Transfer</option>
                <option value="CHEQUE">Manager Cheque</option>
                <option value="CARD">Credit/Debit Card</option>
                <option value="ESCROW_DEPOSIT">Escrow Account Deposit</option>
              </select>
            </div>
          </div>

          {/* Dynamic Price & Balance Calculation */}
          {(() => {
            const selectedUnit = units.find((u) => u.id === form.unitId);
            if (!selectedUnit) return null;

            const unitPrice = selectedUnit.finalPrice || 0;
            const token = Math.max(0, Number(form.tokenAmount || 0));
            const balance = Math.max(0, unitPrice - token);
            const tokenPct = unitPrice > 0 ? ((token / unitPrice) * 100).toFixed(1) : "0.0";
            const balancePct = unitPrice > 0 ? ((balance / unitPrice) * 100).toFixed(1) : "0.0";

            return (
              <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2 text-xs shadow-2xs">
                <div className="flex justify-between items-center text-[#64748B]">
                  <span>Total Property Price:</span>
                  <span className="font-semibold text-[#172033] font-mono">
                    {formatCurrency(unitPrice)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[#64748B]">
                  <span>Token Advance (Escrow Booking):</span>
                  <span className="font-semibold text-emerald-700 font-mono">
                    - {formatCurrency(token)} ({tokenPct}%)
                  </span>
                </div>
                <div className="pt-2 border-t border-[#E2E8F0] flex justify-between items-center">
                  <span className="font-bold text-[#102C4C]">Remaining Balance Payable:</span>
                  <span className="font-bold text-sm text-[#2563EB] font-mono">
                    {formatCurrency(balance)} ({balancePct}%)
                  </span>
                </div>
              </div>
            );
          })()}

          <div>
            <label className="block text-xs font-semibold text-[#172033] mb-1">
              Payment Reference / Cheque #
            </label>
            <input
              type="text"
              value={form.paymentReference}
              onChange={(e) => setForm({ ...form, paymentReference: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg font-mono"
            />
          </div>
        </form>
      </Modal>

      {/* Direct Quotation Generation Modal */}
      <Modal
        open={!!quotationModalEOI}
        onClose={() => setQuotationModalEOI(null)}
        title="Generate Official Quotation"
        description={`Create a formal financial proposal for ${quotationModalEOI?.buyer.companyName || `${quotationModalEOI?.buyer.firstName} ${quotationModalEOI?.buyer.lastName}`}`}
        size="lg"
        footer={
          <>
            <button
              onClick={() => setQuotationModalEOI(null)}
              className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateQuotation}
              disabled={generatingQuotation}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg shadow-xs"
            >
              <Receipt className="w-4 h-4" />
              {generatingQuotation ? "Generating..." : "Generate Official Quotation"}
            </button>
          </>
        }
      >
        {quotationModalEOI && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">Purchaser</span>
                <p className="font-semibold text-[#172033] mt-0.5">
                  {quotationModalEOI.buyer.companyName || `${quotationModalEOI.buyer.firstName} ${quotationModalEOI.buyer.lastName}`}
                </p>
                <p className="text-[10px] text-[#64748B] font-mono">{quotationModalEOI.buyer.accountNumber}</p>
              </div>
              <div>
                <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">Reserved Unit</span>
                <p className="font-semibold text-[#172033] mt-0.5">
                  Unit {quotationModalEOI.unit.unitNumber} ({quotationModalEOI.project.name})
                </p>
                <p className="text-[10px] text-emerald-700 font-bold">
                  Base Price: {formatCurrency(quotationModalEOI.unitPrice || quotationModalEOI.unit.finalPrice)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Promotional Discount (AED)
                </label>
                <input
                  type="number"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg font-mono"
                  placeholder="0"
                />
              </div>
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">
                  Token Advance Paid (EOI)
                </span>
                <p className="font-bold text-xs text-emerald-700 mt-0.5 font-mono">
                  {formatCurrency(quotationModalEOI.tokenAmount || 0)} (Credited)
                </p>
                <p className="text-[10px] text-[#64748B]">Escrow deposit will be deducted from down payment</p>
              </div>
            </div>

            {/* Financial Summary Card */}
            {(() => {
              const basePrice = quotationModalEOI.unitPrice || quotationModalEOI.unit.finalPrice;
              const netPrice = Math.max(0, basePrice - discountAmount);
              const tokenPaid = quotationModalEOI.tokenAmount || 0;
              const balancePayable = Math.max(0, netPrice - tokenPaid);

              return (
                <div className="p-3.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#64748B]">
                    <span>Total Gross Property Value:</span>
                    <span className="font-semibold text-[#172033] font-mono">{formatCurrency(basePrice)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Promotional Discount:</span>
                      <span className="font-semibold font-mono">- {formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-emerald-700">
                    <span className="font-semibold">Token Advance Paid (Credited):</span>
                    <span className="font-bold font-mono">- {formatCurrency(tokenPaid)}</span>
                  </div>
                  <div className="pt-2 border-t border-[#BFDBFE] flex justify-between items-center">
                    <span className="font-bold text-[#1E40AF]">Net Balance Payable by Client:</span>
                    <span className="font-bold text-sm text-[#1E40AF] font-mono">
                      {formatCurrency(balancePayable)}
                    </span>
                  </div>
                </div>
              );
            })()}

            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">
                Milestone Schedule with Token Credit Breakdown (100% total)
              </label>
              <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] text-[#64748B] uppercase">
                    <tr>
                      <th className="px-3 py-1.5">Milestone</th>
                      <th className="px-3 py-1.5 text-right">Share (%)</th>
                      <th className="px-3 py-1.5 text-right">Gross Amount</th>
                      <th className="px-3 py-1.5 text-right">Net Due on Signing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {(() => {
                      const netPrice = Math.max(0, (quotationModalEOI.unitPrice || quotationModalEOI.unit.finalPrice) - discountAmount);
                      const tokenPaid = quotationModalEOI.tokenAmount || 0;
                      const downPaymentGross = netPrice * 0.2;
                      const downPaymentNet = Math.max(0, downPaymentGross - tokenPaid);

                      return (
                        <>
                          <tr className="bg-emerald-50/40">
                            <td className="px-3 py-2 font-medium">
                              1. Down Payment on Booking
                              <span className="block text-[10px] text-emerald-700 font-normal">
                                (AED {formatCurrency(tokenPaid)} token advance credited)
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right font-semibold">20%</td>
                            <td className="px-3 py-2 text-right font-mono text-[#64748B]">
                              {formatCurrency(downPaymentGross)}
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-bold text-emerald-800">
                              {formatCurrency(downPaymentNet)}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 font-medium">2. Foundation Completion</td>
                            <td className="px-3 py-2 text-right font-semibold">20%</td>
                            <td className="px-3 py-2 text-right font-mono text-[#64748B]">
                              {formatCurrency(netPrice * 0.2)}
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-bold text-[#172033]">
                              {formatCurrency(netPrice * 0.2)}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 font-medium">3. Superstructure & MEP</td>
                            <td className="px-3 py-2 text-right font-semibold">20%</td>
                            <td className="px-3 py-2 text-right font-mono text-[#64748B]">
                              {formatCurrency(netPrice * 0.2)}
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-bold text-[#172033]">
                              {formatCurrency(netPrice * 0.2)}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 font-medium">4. Handover & Key Release</td>
                            <td className="px-3 py-2 text-right font-semibold">40%</td>
                            <td className="px-3 py-2 text-right font-mono text-[#64748B]">
                              {formatCurrency(netPrice * 0.4)}
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-bold text-[#172033]">
                              {formatCurrency(netPrice * 0.4)}
                            </td>
                          </tr>
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Direct PO Generation Modal */}
      <Modal
        open={!!poModalEOI}
        onClose={() => setPoModalEOI(null)}
        title="Generate Purchase Order"
        description={`Formalize unit sale contract for ${poModalEOI?.buyer.companyName || `${poModalEOI?.buyer.firstName} ${poModalEOI?.buyer.lastName}`}`}
        footer={
          <>
            <button
              onClick={() => setPoModalEOI(null)}
              className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleGeneratePO}
              disabled={generatingPO}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#153B66] hover:bg-[#102C4C] text-white rounded-lg shadow-xs"
            >
              <ShoppingCart className="w-4 h-4" />
              {generatingPO ? "Creating PO..." : "Issue Purchase Order"}
            </button>
          </>
        }
      >
        {poModalEOI && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-1">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Buyer:</span>
                <span className="font-semibold text-[#172033]">
                  {poModalEOI.buyer.companyName || `${poModalEOI.buyer.firstName} ${poModalEOI.buyer.lastName}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Allocated Unit:</span>
                <span className="font-semibold text-[#172033]">
                  Unit {poModalEOI.unit.unitNumber} ({poModalEOI.project.name})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Total Contract Value:</span>
                <span className="font-bold text-emerald-700">
                  {formatCurrency(poModalEOI.unitPrice || poModalEOI.unit.finalPrice)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">
                Down Payment / Token Credited (AED) *
              </label>
              <input
                type="number"
                required
                value={poDownPayment}
                onChange={(e) => setPoDownPayment(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">
                Payment Plan Schedule Structure
              </label>
              <select
                value={poPaymentPlan}
                onChange={(e) => setPoPaymentPlan(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-white"
              >
                <option value="Construction Linked 60/40">Construction Linked 60/40</option>
                <option value="Milestone 50/50 Post-Handover">Milestone 50/50 Post-Handover</option>
                <option value="Cash 100% Upfront Discounted">Cash 100% Upfront Discounted</option>
                <option value="Standard 80/20 Escrow Schedule">Standard 80/20 Escrow Schedule</option>
              </select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
