"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Receipt,
  Plus,
  FileText,
  Printer,
  CheckCircle2,
  Calendar,
  Building,
  DollarSign,
  ShoppingCart,
  ArrowRight,
} from "lucide-react";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatCurrency } from "@/lib/utils";

interface QuotationItem {
  id: string;
  quotationNumber: string;
  version: number;
  buyerId: string;
  projectId: string;
  unitId: string;
  basePrice: number;
  floorPremium: number;
  viewPremium: number;
  otherFees: number;
  discount: number;
  finalPrice: number;
  currency: string;
  status: string;
  createdAt: string;
  buyer: { id: string; firstName: string; lastName: string; companyName: string; accountNumber: string };
  project: { id: string; name: string; code: string };
  unit: { id: string; unitNumber: string };
  paymentMilestones: any[];
}

export default function QuotationsPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [quotations, setQuotations] = useState<QuotationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePreview, setActivePreview] = useState<QuotationItem | null>(null);

  // New Quotation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generatingPOId, setGeneratingPOId] = useState<string | null>(null);

  // Data for selection
  const [buyers, setBuyers] = useState<any[]>([]);
  const [eois, setEois] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);

  const [form, setForm] = useState({
    buyerId: "",
    projectId: "",
    unitId: "",
    eoiId: "",
    basePrice: 0,
    floorPremium: 0,
    viewPremium: 0,
    otherFees: 0,
    discount: 0,
    finalPrice: 0,
  });

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/quotations");
      const data = await res.json();
      setQuotations(data.quotations || []);
    } catch {
      addToast("error", "Error", "Failed to load quotations");
    } finally {
      setLoading(false);
    }
  };

  const loadDependencies = async () => {
    try {
      const [bRes, eRes, uRes] = await Promise.all([
        fetch("/api/buyers"),
        fetch("/api/eois"),
        fetch("/api/units"),
      ]);
      const bData = await bRes.json();
      const eData = await eRes.json();
      const uData = await uRes.json();

      setBuyers(bData.buyers || []);
      setEois((eData.eois || []).filter((e: any) => e.paymentStatus === "VERIFIED"));
      setUnits(uData.units || []);
    } catch (err) {
      console.error("Failed to load options", err);
    }
  };

  useEffect(() => {
    fetchQuotations();
    loadDependencies();
  }, []);

  // When user selects a verified EOI in the modal
  const handleSelectEOI = (eoiId: string) => {
    const selected = eois.find((e) => e.id === eoiId);
    if (!selected) return;

    const base = selected.unitPrice || selected.unit?.finalPrice || 0;
    setForm({
      buyerId: selected.buyer?.id || "",
      projectId: selected.project?.id || "",
      unitId: selected.unit?.id || "",
      eoiId: selected.id,
      basePrice: base,
      floorPremium: 0,
      viewPremium: 0,
      otherFees: 0,
      discount: 0,
      finalPrice: base,
    });
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.buyerId || !form.unitId || !form.projectId) {
      addToast("error", "Error", "Please select a buyer, project, and unit");
      return;
    }

    setSubmitting(true);
    try {
      const finalPrice = Math.max(
        0,
        form.basePrice + form.floorPremium + form.viewPremium + form.otherFees - form.discount
      );

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
          ...form,
          finalPrice,
          currency: "AED",
          milestones,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create quotation");

      addToast(
        "success",
        "Quotation Created",
        `Quotation #${data.quotation.quotationNumber} logged with 100% milestone schedule.`
      );
      setShowCreateModal(false);
      fetchQuotations();
    } catch (err: any) {
      addToast("error", "Error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Convert Quotation to Purchase Order directly
  const handleGeneratePOFromQuotation = async (quotation: QuotationItem) => {
    setGeneratingPOId(quotation.id);
    try {
      const downPayment = Math.round(quotation.finalPrice * 0.1); // 10% standard down payment
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerId: quotation.buyerId,
          projectId: quotation.projectId,
          unitId: quotation.unitId,
          quotationId: quotation.id,
          unitPrice: quotation.basePrice,
          discount: quotation.discount,
          additionalCharges: quotation.floorPremium + quotation.viewPremium + quotation.otherFees,
          finalAmount: quotation.finalPrice,
          downPayment: downPayment,
          paymentPlan: "Construction Linked 60/40",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate PO");

      addToast(
        "success",
        "Purchase Order Generated!",
        `PO #${data.po.poNumber} created from quotation #${quotation.quotationNumber}.`
      );
      router.push("/purchase-orders");
    } catch (err: any) {
      addToast("error", "Error Generating PO", err.message);
    } finally {
      setGeneratingPOId(null);
    }
  };

  const columns: Column<QuotationItem>[] = [
    {
      key: "quotationNumber",
      label: "Quotation #",
      sortable: true,
      render: (item) => (
        <span className="font-mono text-xs font-bold text-[#2563EB]">
          {item.quotationNumber} (v{item.version})
        </span>
      ),
    },
    {
      key: "buyer",
      label: "Client / Entity",
      render: (item) => (
        <div>
          <p className="font-semibold text-xs text-[#172033]">
            {item.buyer?.companyName || `${item.buyer?.firstName} ${item.buyer?.lastName}`}
          </p>
          <p className="text-[10px] text-[#64748B]">{item.buyer?.accountNumber}</p>
        </div>
      ),
    },
    {
      key: "unit",
      label: "Property Unit",
      render: (item) => (
        <div>
          <span className="font-mono text-xs font-bold text-[#172033]">
            {item.unit?.unitNumber}
          </span>
          <p className="text-[10px] text-[#64748B]">{item.project?.name}</p>
        </div>
      ),
    },
    {
      key: "finalPrice",
      label: "Agreed Price",
      render: (item) => (
        <span className="text-xs font-bold text-emerald-700">
          {formatCurrency(item.finalPrice)}
        </span>
      ),
    },
    {
      key: "milestones",
      label: "Milestones",
      render: (item) => (
        <span className="text-xs text-[#64748B]">
          {item.paymentMilestones?.length || 0} Schedule Stages
        </span>
      ),
    },
    {
      key: "status",
      label: "Approval Status",
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "createdAt",
      label: "Generated",
      render: (item) => (
        <span className="text-xs text-[#64748B]">{formatDate(item.createdAt)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-blue-600" />
            Official Quotations & Payment Plans
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Formal financial proposals, milestone payment plans (100% schedule balance), and client contract offers
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Quotation
        </button>
      </div>

      <DataTable
        data={quotations}
        columns={columns}
        loading={loading}
        emptyMessage="No quotations generated."
        actions={(item) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => setActivePreview(item)}
              className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded-md text-[11px] font-semibold text-slate-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              Formal PDF View
            </button>
            <button
              onClick={() => handleGeneratePOFromQuotation(item)}
              disabled={generatingPOId === item.id}
              className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[11px] font-semibold transition-colors shadow-xs disabled:opacity-50"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {generatingPOId === item.id ? "Creating..." : "Generate PO"}
            </button>
          </div>
        )}
      />

      {/* Create Quotation Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Official Quotation"
        description="Generate milestone payment plan and formal price proposal"
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
              onClick={handleCreateQuotation}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold bg-[#153B66] hover:bg-[#102C4C] text-white rounded-lg shadow-xs"
            >
              {submitting ? "Generating..." : "Generate Quotation"}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateQuotation} className="space-y-4 text-xs">
          {eois.length > 0 && (
            <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg">
              <label className="block text-xs font-semibold text-[#1E40AF] mb-1">
                Quick Fill from Active Reservation / Verified EOI
              </label>
              <select
                value={form.eoiId}
                onChange={(e) => handleSelectEOI(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#BFDBFE] rounded-lg bg-white"
              >
                <option value="">-- Or choose an active reservation below --</option>
                {eois.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.eoiNumber} — {e.buyer?.firstName} {e.buyer?.lastName} ({e.buyer?.companyName || e.buyer?.accountNumber}) | Unit {e.unit?.unitNumber} ({formatCurrency(e.unitPrice || e.unit?.finalPrice)})
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
                    basePrice: u?.finalPrice || 0,
                    finalPrice: u?.finalPrice || 0,
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
                Base Price (AED) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={form.basePrice}
                onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">
                Promotional Discount (AED)
              </label>
              <input
                type="number"
                min="0"
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg font-mono"
              />
            </div>
          </div>

          {/* Dynamic Net Investment with Token Advance if EOI linked */}
          {(() => {
            const selectedEOI = eois.find((e) => e.id === form.eoiId);
            const tokenPaid = selectedEOI ? selectedEOI.tokenAmount || 0 : 0;
            const netPrice = Math.max(
              0,
              form.basePrice + form.floorPremium + form.viewPremium + form.otherFees - form.discount
            );
            const balanceDue = Math.max(0, netPrice - tokenPaid);

            return (
              <div className="p-3.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between text-[#64748B]">
                  <span>Agreed Gross Investment:</span>
                  <span className="font-semibold text-[#172033] font-mono">{formatCurrency(netPrice)}</span>
                </div>
                {tokenPaid > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span className="font-semibold">Token Advance Credited (from EOI):</span>
                    <span className="font-bold font-mono">- {formatCurrency(tokenPaid)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-[#BFDBFE] flex justify-between items-center">
                  <span className="font-bold text-[#1E40AF]">
                    {tokenPaid > 0 ? "Net Remaining Balance Payable:" : "Total Net Investment:"}
                  </span>
                  <span className="font-bold text-sm text-[#1E40AF] font-mono">
                    {formatCurrency(balanceDue)}
                  </span>
                </div>
              </div>
            );
          })()}

          <div>
            <label className="block text-xs font-semibold text-[#172033] mb-1">
              Included Payment Milestones (100% Construction-Linked)
            </label>
            <div className="border border-[#E2E8F0] rounded-lg p-2.5 bg-white space-y-1 text-[11px] text-[#64748B]">
              <div className="flex justify-between font-medium">
                <span>1. Down Payment on Booking</span>
                <span className="font-mono font-semibold text-[#172033]">20%</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>2. Foundation Completion</span>
                <span className="font-mono font-semibold text-[#172033]">20%</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>3. Superstructure & MEP</span>
                <span className="font-mono font-semibold text-[#172033]">20%</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>4. Handover & Key Release</span>
                <span className="font-mono font-semibold text-[#172033]">40%</span>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Quotation Formal PDF Preview Modal */}
      <Modal
        open={!!activePreview}
        onClose={() => setActivePreview(null)}
        title={`Official Quotation: ${activePreview?.quotationNumber}`}
        description="PentaCloud Property Transaction Proposal"
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-[#64748B]">
              Approved for buyer issuance under UAE Real Estate Regulations
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#153B66] text-white text-xs font-semibold rounded-lg"
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
            {/* Letterhead */}
            <div className="flex items-start justify-between pb-4 border-b border-[#E2E8F0]">
              <div>
                <h1 className="text-lg font-bold text-[#102C4C]">PENTACLOUD PROPERTIES</h1>
                <p className="text-[10px] text-[#64748B]">
                  Executive Real Estate Development & Escrow Management
                </p>
                <p className="text-[10px] text-[#64748B]">DIFC Gate Tower 4, Dubai, UAE</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-sm font-bold text-[#2563EB]">
                  {activePreview.quotationNumber}
                </span>
                <p className="text-[10px] text-[#94A3B8] mt-0.5">
                  Date: {formatDate(activePreview.createdAt)}
                </p>
              </div>
            </div>

            {/* Buyer & Unit Details */}
            <div className="grid grid-cols-2 gap-4 p-3 bg-[#F8FAFC] rounded-lg">
              <div>
                <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">
                  Purchaser / Entity
                </span>
                <p className="font-bold text-xs mt-0.5">
                  {activePreview.buyer?.companyName ||
                    `${activePreview.buyer?.firstName} ${activePreview.buyer?.lastName}`}
                </p>
                <p className="text-[#64748B] text-[10px]">
                  Account: {activePreview.buyer?.accountNumber}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">
                  Property Allocation
                </span>
                <p className="font-bold text-xs mt-0.5">
                  Unit {activePreview.unit?.unitNumber} • {activePreview.project?.name}
                </p>
                <p className="text-[#64748B] text-[10px]">
                  Project Code: {activePreview.project?.code}
                </p>
              </div>
            </div>

            {/* Price Table */}
            <div className="space-y-1.5">
              <p className="font-bold uppercase tracking-wider text-[10px] text-[#64748B]">
                Price Computation Breakdown
              </p>
              <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-[#E2E8F0]">
                    <tr>
                      <td className="px-3 py-2 text-[#64748B]">Base Unit Purchase Price</td>
                      <td className="px-3 py-2 text-right font-medium">
                        {formatCurrency(activePreview.basePrice)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 text-[#64748B]">Floor & Elevation Premium</td>
                      <td className="px-3 py-2 text-right font-medium">
                        {formatCurrency(activePreview.floorPremium)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 text-[#64748B]">View & Orientation Premium</td>
                      <td className="px-3 py-2 text-right font-medium">
                        {formatCurrency(activePreview.viewPremium)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 text-[#64748B]">DLD & Registration Charges</td>
                      <td className="px-3 py-2 text-right font-medium">
                        {formatCurrency(activePreview.otherFees)}
                      </td>
                    </tr>
                    {activePreview.discount > 0 && (
                      <tr>
                        <td className="px-3 py-2 text-rose-600 font-medium">Promotional Discount</td>
                        <td className="px-3 py-2 text-right text-rose-600 font-medium">
                          - {formatCurrency(activePreview.discount)}
                        </td>
                      </tr>
                    )}
                    <tr className="bg-[#F8FAFC] font-bold">
                      <td className="px-3 py-2.5 text-[#102C4C] text-sm">Total Net Investment</td>
                      <td className="px-3 py-2.5 text-right text-sm text-emerald-700">
                        {formatCurrency(activePreview.finalPrice)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment Milestone Schedule (Must validate to 100%) */}
            <div className="space-y-1.5">
              <p className="font-bold uppercase tracking-wider text-[10px] text-[#64748B]">
                Milestone Payment Schedule (100% Construction-Linked)
              </p>
              <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] text-[#64748B] uppercase">
                    <tr>
                      <th className="px-3 py-2">Stage</th>
                      <th className="px-3 py-2">Milestone Description</th>
                      <th className="px-3 py-2 text-right">Share (%)</th>
                      <th className="px-3 py-2 text-right">Amount (AED)</th>
                      <th className="px-3 py-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {(activePreview.paymentMilestones || []).map((m: any, i: number) => (
                      <tr key={m.id || i}>
                        <td className="px-3 py-2 font-mono text-[11px]">{i + 1}</td>
                        <td className="px-3 py-2 font-medium">{m.name}</td>
                        <td className="px-3 py-2 text-right font-semibold">{m.percentage}%</td>
                        <td className="px-3 py-2 text-right font-bold text-[#172033]">
                          {formatCurrency(m.amount)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <StatusBadge status={m.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
