"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Eye,
  UserCheck,
  Building,
  Briefcase,
  FileText,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatCurrency } from "@/lib/utils";

interface BuyerItem {
  id: string;
  accountNumber: string;
  buyerType: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  email: string | null;
  mobile: string | null;
  nationality: string | null;
  countryOfResidence: string | null;
  relationshipManager: { firstName: string; lastName: string } | null;
  opportunities: any[];
  onboarding: { status: string; completionPercentage: number } | null;
  _count: { eois: number; purchaseOrders: number; documents: number };
  createdAt: string;
}

export default function BuyersPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [buyers, setBuyers] = useState<BuyerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    buyerType: "INDIVIDUAL",
    firstName: "",
    lastName: "",
    companyName: "",
    tradeLicenseNumber: "",
    email: "",
    mobile: "",
    whatsapp: "",
    nationality: "UAE",
    countryOfResidence: "UAE",
    passportNumber: "",
    nationalId: "",
  });

  const fetchBuyers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (typeFilter) params.set("type", typeFilter);

      const res = await fetch(`/api/buyers?${params}`);
      const data = await res.json();
      setBuyers(data.buyers || []);
    } catch {
      addToast("error", "Error", "Failed to fetch buyers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuyers();
  }, [typeFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/buyers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create account");

      addToast("success", "Buyer Account Created", `Account #${data.buyer.accountNumber} created.`);
      setShowCreateModal(false);
      fetchBuyers();
      router.push(`/buyers/${data.buyer.id}`);
    } catch (err: any) {
      addToast("error", "Error", err.message);
    } finally {
      setCreating(false);
    }
  };

  const columns: Column<BuyerItem>[] = [
    {
      key: "accountNumber",
      label: "Account ID",
      sortable: true,
      render: (item) => (
        <span className="font-mono text-xs font-semibold text-[#2563EB]">
          {item.accountNumber}
        </span>
      ),
    },
    {
      key: "name",
      label: "Buyer / Entity Name",
      sortable: true,
      render: (item) => (
        <button
          onClick={() => router.push(`/buyers/${item.id}`)}
          className="text-left font-semibold text-[#172033] hover:text-[#2563EB] transition-colors"
        >
          {item.buyerType === "CORPORATE"
            ? item.companyName
            : `${item.firstName} ${item.lastName}`}
        </button>
      ),
    },
    {
      key: "buyerType",
      label: "Category",
      render: (item) => (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
            item.buyerType === "CORPORATE"
              ? "bg-purple-50 text-purple-700 border-purple-200"
              : "bg-blue-50 text-blue-700 border-blue-200"
          }`}
        >
          {item.buyerType === "CORPORATE" ? (
            <Briefcase className="w-3 h-3" />
          ) : (
            <UserCheck className="w-3 h-3" />
          )}
          {item.buyerType}
        </span>
      ),
    },
    {
      key: "contact",
      label: "Contact",
      render: (item) => (
        <div className="text-xs">
          <p className="font-medium text-[#172033]">{item.mobile || "-"}</p>
          <p className="text-[#64748B] text-[11px] truncate max-w-[140px]">
            {item.email || "-"}
          </p>
        </div>
      ),
    },
    {
      key: "country",
      label: "Origin",
      render: (item) => (
        <span className="text-xs text-[#64748B]">
          {item.nationality || item.countryOfResidence || "-"}
        </span>
      ),
    },
    {
      key: "onboarding",
      label: "KYC / Onboarding",
      render: (item) => (
        <div className="text-xs">
          {item.onboarding ? (
            <div className="space-y-1">
              <StatusBadge status={item.onboarding.status} />
              <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full"
                  style={{ width: `${item.onboarding.completionPercentage}%` }}
                />
              </div>
            </div>
          ) : (
            <span className="text-[#94A3B8]">Not Initiated</span>
          )}
        </div>
      ),
    },
    {
      key: "advisor",
      label: "Relationship Mgr",
      render: (item) => (
        <span className="text-xs text-[#172033] font-medium">
          {item.relationshipManager
            ? `${item.relationshipManager.firstName} ${item.relationshipManager.lastName}`
            : "-"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Buyer Accounts"
        description="Comprehensive records for individual local, foreign, and institutional purchasers"
        actions={
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#153B66] hover:bg-[#102C4C] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            New Buyer Account
          </button>
        }
      />

      {/* Filter Row */}
      <div className="flex items-center gap-2.5 p-3.5 bg-white border border-[#E2E8F0] rounded-xl shadow-xs">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="text-xs font-medium border border-[#E2E8F0] rounded-lg px-3 py-1.5 bg-[#F8FAFC] text-[#172033]"
        >
          <option value="">All Buyer Types</option>
          <option value="INDIVIDUAL">Individual Buyers</option>
          <option value="CORPORATE">Corporate / Institutional</option>
        </select>
      </div>

      <DataTable
        data={buyers}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search by name, company, account ID, email..."
        onSearch={(q) => {
          setSearch(q);
          fetchBuyers();
        }}
        emptyMessage="No buyer accounts found."
        actions={(item) => (
          <button
            onClick={() => router.push(`/buyers/${item.id}`)}
            className="p-1.5 text-[#64748B] hover:text-[#2563EB] hover:bg-[#EFF6FF] rounded-lg transition-colors"
            title="View 360 Profile"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
      />

      {/* Create Buyer Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Direct Buyer Account"
        description="Select category and enter authorized entity details"
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
              onClick={handleCreate}
              disabled={creating}
              className="px-4 py-2 text-xs font-semibold bg-[#153B66] hover:bg-[#102C4C] text-white rounded-lg shadow-xs"
            >
              {creating ? "Creating..." : "Create Account"}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#172033] mb-1">
              Account Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, buyerType: "INDIVIDUAL" })}
                className={`p-3 text-left border rounded-xl transition-all ${
                  form.buyerType === "INDIVIDUAL"
                    ? "border-[#2563EB] bg-[#EFF6FF] text-[#153B66] font-bold"
                    : "border-[#E2E8F0] hover:bg-[#F8FAFC]"
                }`}
              >
                <UserCheck className="w-4 h-4 mb-1" />
                <p className="text-xs">Individual Buyer</p>
                <p className="text-[10px] text-[#64748B] font-normal">Resident or international private investor</p>
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, buyerType: "CORPORATE" })}
                className={`p-3 text-left border rounded-xl transition-all ${
                  form.buyerType === "CORPORATE"
                    ? "border-[#2563EB] bg-[#EFF6FF] text-[#153B66] font-bold"
                    : "border-[#E2E8F0] hover:bg-[#F8FAFC]"
                }`}
              >
                <Briefcase className="w-4 h-4 mb-1" />
                <p className="text-xs">Corporate / Entity</p>
                <p className="text-[10px] text-[#64748B] font-normal">LLC, Holding company or Fund</p>
              </button>
            </div>
          </div>

          {form.buyerType === "INDIVIDUAL" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Passport Number
                </label>
                <input
                  type="text"
                  value={form.passportNumber}
                  onChange={(e) => setForm({ ...form, passportNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  National / Emirates ID
                </label>
                <input
                  type="text"
                  value={form.nationalId}
                  onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Company Name (Registered) *
                </label>
                <input
                  type="text"
                  required
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Commercial Trade License #
                </label>
                <input
                  type="text"
                  value={form.tradeLicenseNumber}
                  onChange={(e) => setForm({ ...form, tradeLicenseNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Country of Incorporation
                </label>
                <input
                  type="text"
                  value={form.countryOfResidence}
                  onChange={(e) => setForm({ ...form, countryOfResidence: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[#F1F5F9]">
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">
                Mobile Number *
              </label>
              <input
                type="tel"
                required
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

