"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Handshake,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  Home,
  Calendar,
  CheckCircle2,
  TrendingUp,
  MapPin,
  ExternalLink,
  Users,
  Compass,
  Layers,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";

interface BrokerItem {
  id: string;
  brokerNumber: string;
  name: string;
  tradeLicense: string | null;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  propertySpecialization: string | null;
  monthlyClosed: number;
  quarterlyClosed: number;
  yearlyClosed: number;
  tier: string;
  status: string;
  address: string | null;
  notes: string | null;
  createdAt: string;
  _count?: {
    leads: number;
    buyers: number;
    opportunities: number;
  };
}

export default function BrokersPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [brokers, setBrokers] = useState<BrokerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    tradeLicense: "",
    contactPerson: "",
    email: "",
    phone: "",
    propertySpecialization: "Apartments & Luxury Villas",
    monthlyClosed: 4,
    quarterlyClosed: 14,
    yearlyClosed: 42,
    tier: "GOLD",
    status: "ACTIVE",
    address: "",
    notes: "",
  });

  const fetchBrokers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/brokers");
      const data = await res.json();
      setBrokers(data.brokers || []);
    } catch {
      addToast("error", "Error", "Failed to retrieve brokers list");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchBrokers();
  }, [fetchBrokers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);

    try {
      const res = await fetch("/api/brokers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create broker");

      addToast("success", "Broker Registered", `${form.name} is now approved for property showings.`);
      setShowCreateModal(false);
      setForm({
        name: "",
        tradeLicense: "",
        contactPerson: "",
        email: "",
        phone: "",
        propertySpecialization: "Apartments & Luxury Villas",
        monthlyClosed: 4,
        quarterlyClosed: 14,
        yearlyClosed: 42,
        tier: "GOLD",
        status: "ACTIVE",
        address: "",
        notes: "",
      });
      fetchBrokers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create broker";
      addToast("error", "Error", msg);
    } finally {
      setCreating(false);
    }
  };

  const filteredBrokers = useMemo(() => {
    return brokers.filter((b) => {
      const matchSearch =
        search === "" ||
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.brokerNumber.toLowerCase().includes(search.toLowerCase()) ||
        (b.tradeLicense && b.tradeLicense.toLowerCase().includes(search.toLowerCase())) ||
        (b.contactPerson && b.contactPerson.toLowerCase().includes(search.toLowerCase())) ||
        (b.propertySpecialization && b.propertySpecialization.toLowerCase().includes(search.toLowerCase()));

      const matchTier = tierFilter === "ALL" || b.tier === tierFilter;
      const matchStatus = statusFilter === "ALL" || b.status === statusFilter;

      return matchSearch && matchTier && matchStatus;
    });
  }, [brokers, search, tierFilter, statusFilter]);

  // Aggregate Performance Metrics: Monthly, Quarterly, Yearly Closings
  const totalMonthlyClosed = useMemo(() => {
    return brokers.reduce((acc, b) => acc + (b.monthlyClosed || 0), 0);
  }, [brokers]);

  const totalQuarterlyClosed = useMemo(() => {
    return brokers.reduce((acc, b) => acc + (b.quarterlyClosed || 0), 0);
  }, [brokers]);

  const totalYearlyClosed = useMemo(() => {
    return brokers.reduce((acc, b) => acc + (b.yearlyClosed || 0), 0);
  }, [brokers]);

  const totalActive = useMemo(() => brokers.filter((b) => b.status === "ACTIVE").length, [brokers]);

  return (
    <div className="space-y-6 max-w-full pb-16">
      {/* Top Command Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Handshake className="w-6 h-6 text-blue-600" />
              Brokers & Showing Agents
            </h1>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {brokers.length} Agencies
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Certified partner agencies representing developments with recorded monthly, quarterly, and yearly closing performance.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Broker
        </button>
      </div>

      {/* KPI Performance Ribbon: Clean Blue & White */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Monthly Closings</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{totalMonthlyClosed} Deals Closed</div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Current month transaction volume
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quarterly Closings</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-blue-600 mt-1">{totalQuarterlyClosed} Deals Closed</div>
          <p className="text-[11px] text-slate-500 mt-1">Current quarter cumulative sales</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Yearly Closings</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{totalYearlyClosed} Deals Closed</div>
          <p className="text-[11px] text-slate-500 mt-1">Total annual property conversions</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Agencies</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{totalActive} Agencies</div>
          <p className="text-[11px] text-slate-500 mt-1">Available for apartment & villa showings</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by agency, property scope, RERA ORN..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:border-blue-600 outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">Tier:</span>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-700 outline-none"
            >
              <option value="ALL">All Tiers</option>
              <option value="PLATINUM">Platinum</option>
              <option value="GOLD">Gold</option>
              <option value="SILVER">Silver</option>
              <option value="BRONZE">Bronze</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-700 outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Brokers Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="p-4">Reference</th>
                <th className="p-4">Brokerage / Agency</th>
                <th className="p-4">Property Showcase Scope</th>
                <th className="p-4">Primary Contact</th>
                <th className="p-4 text-center">Monthly Closed</th>
                <th className="p-4 text-center">Quarterly Closed</th>
                <th className="p-4 text-center">Yearly Closed</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBrokers.map((broker) => {
                return (
                  <tr key={broker.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono font-semibold text-blue-600">
                      {broker.brokerNumber}
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{broker.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            License: {broker.tradeLicense || "RERA Verified"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="font-medium text-slate-700 flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>{broker.propertySpecialization || "Apartments & Villas"}</span>
                      </span>
                    </td>

                    <td className="p-4">
                      <p className="font-semibold text-slate-800">{broker.contactPerson || "Lead Agent"}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        {broker.phone && <span>{broker.phone}</span>}
                        {broker.email && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[150px]">{broker.email}</span>
                          </>
                        )}
                      </div>
                    </td>

                    <td className="p-4 text-center">
                      <span className="font-semibold text-slate-800 bg-slate-50 px-2.5 py-1 rounded-md text-xs border border-slate-200">
                        {broker.monthlyClosed} Closed
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      <span className="font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md text-xs border border-blue-200">
                        {broker.quarterlyClosed} Closed
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md text-xs border border-blue-200">
                        {broker.yearlyClosed} Closed
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      <StatusBadge status={broker.status} />
                    </td>
                  </tr>
                );
              })}

              {filteredBrokers.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-[#94A3B8]">
                    No brokers found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register New Broker Modal - Clean 2-column Layout */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Register Showing Broker / Agency"
        description="Add a new certified real estate brokerage for showing apartments, villas, and off-plan units"
        footer={
          <>
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || !form.name.trim()}
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
            >
              {creating ? "Registering..." : "Register Broker"}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Brokerage / Agency Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Waseem (Broker), Apex Realty, etc."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                RERA Trade License / ORN
              </label>
              <input
                type="text"
                value={form.tradeLicense}
                onChange={(e) => setForm({ ...form, tradeLicense: e.target.value })}
                placeholder="e.g. ORN-7860"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none font-mono focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Primary Contact Person
              </label>
              <input
                type="text"
                value={form.contactPerson}
                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                placeholder="e.g. Waseem"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="e.g. +971 50 123 4567"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Property Showcase Scope
              </label>
              <input
                type="text"
                value={form.propertySpecialization}
                onChange={(e) => setForm({ ...form, propertySpecialization: e.target.value })}
                placeholder="e.g. Waterfront Apartments & Villas"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Broker Tier
              </label>
              <select
                value={form.tier}
                onChange={(e) => setForm({ ...form, tier: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-white focus:border-blue-600"
              >
                <option value="PLATINUM">Platinum</option>
                <option value="GOLD">Gold</option>
                <option value="SILVER">Silver</option>
                <option value="BRONZE">Bronze</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Monthly Closings (Deals)
              </label>
              <input
                type="number"
                min="0"
                value={form.monthlyClosed}
                onChange={(e) => setForm({ ...form, monthlyClosed: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Quarterly Closings (Deals)
              </label>
              <input
                type="number"
                min="0"
                value={form.quarterlyClosed}
                onChange={(e) => setForm({ ...form, quarterlyClosed: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Yearly Closings (Deals)
              </label>
              <input
                type="number"
                min="0"
                value={form.yearlyClosed}
                onChange={(e) => setForm({ ...form, yearlyClosed: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Office Location / Address
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="e.g. Marina Plaza, Floor 19, Dubai"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-600"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
