"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Boxes,
  Building2,
  Filter,
  CheckCircle2,
  Lock,
  DollarSign,
  Eye,
  FileSignature,
  LayoutGrid,
  List,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";
import { UNIT_STATUSES, PROPERTY_TYPES } from "@/lib/constants";

interface UnitItem {
  id: string;
  unitNumber: string;
  projectId: string;
  buildingId: string | null;
  floor: number | null;
  unitType: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  view: string | null;
  basePrice: number;
  floorPremium: number;
  viewPremium: number;
  additionalCharges: number;
  finalPrice: number;
  status: string;
  project: { id: string; name: string; code: string };
  building: { id: string; name: string } | null;
  reservations: { buyer: { firstName: string; lastName: string; companyName: string } }[];
}

export default function InventoryPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [units, setUnits] = useState<UnitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"matrix" | "list">("matrix");

  // Filters
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedBedrooms, setSelectedBedrooms] = useState("");

  // Quick unit detail modal
  const [activeUnit, setActiveUnit] = useState<UnitItem | null>(null);

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedProject) params.set("projectId", selectedProject);
      if (selectedStatus) params.set("status", selectedStatus);
      if (selectedBedrooms) params.set("bedrooms", selectedBedrooms);

      const res = await fetch(`/api/units?${params}`);
      const data = await res.json();
      setUnits(data.units || []);
    } catch {
      addToast("error", "Error", "Failed to fetch inventory units");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, [selectedProject, selectedStatus, selectedBedrooms]);

  // Group units by floor for matrix view
  const unitsByFloor = units.reduce((acc: Record<number, UnitItem[]>, u) => {
    const fl = u.floor || 0;
    if (!acc[fl]) acc[fl] = [];
    acc[fl].push(u);
    return acc;
  }, {});

  const floorKeys = Object.keys(unitsByFloor)
    .map(Number)
    .sort((a, b) => b - a); // Top floor down

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-blue-600" />
            Property Inventory & Unit Matrix
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Live unit availability, pricing tiers, floor/view premiums, and transaction locks
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
            <button
              onClick={() => setViewMode("matrix")}
              className={`p-2 transition-colors ${
                viewMode === "matrix" ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-50"
              }`}
              title="Floor Matrix View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 transition-colors ${
                viewMode === "list" ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-50"
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => router.push("/eoi")}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors"
          >
            <FileSignature className="w-4 h-4" />
            Initiate EOI
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5 p-3.5 bg-white border border-[#E2E8F0] rounded-xl shadow-xs">
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="text-xs font-medium border border-[#E2E8F0] rounded-lg px-3 py-1.5 bg-[#F8FAFC] text-[#172033]"
        >
          <option value="">All Projects</option>
          {Array.from(new Set(units.map((u) => u.project?.name))).filter(Boolean).map((name) => {
            const project = units.find((u) => u.project?.name === name)?.project;
            return (
              <option key={project?.id} value={project?.id}>
                {name}
              </option>
            );
          })}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="text-xs font-medium border border-[#E2E8F0] rounded-lg px-3 py-1.5 bg-[#F8FAFC] text-[#172033]"
        >
          <option value="">All Availability Statuses</option>
          {UNIT_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <select
          value={selectedBedrooms}
          onChange={(e) => setSelectedBedrooms(e.target.value)}
          className="text-xs font-medium border border-[#E2E8F0] rounded-lg px-3 py-1.5 bg-[#F8FAFC] text-[#172033]"
        >
          <option value="">All Bedroom Counts</option>
          <option value="1">1 Bedroom</option>
          <option value="2">2 Bedrooms</option>
          <option value="3">3 Bedrooms</option>
          <option value="4">4 Bedrooms</option>
          <option value="5">5+ Bedrooms</option>
        </select>

        {/* Legend */}
        <div className="flex items-center gap-3 ml-auto text-[11px] font-medium text-[#64748B]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-500" /> Reserved
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-purple-600" /> Sold
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-orange-500" /> On Hold
          </span>
        </div>
      </div>

      {/* Main View: Matrix or List */}
      {viewMode === "matrix" ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-xs space-y-3 overflow-x-auto">
          {floorKeys.map((fl) => (
            <div key={fl} className="flex items-center gap-3 pb-2 border-b border-[#F1F5F9] last:border-0">
              <div className="w-20 text-xs font-bold text-[#64748B] shrink-0">
                Floor {fl === 0 ? "G" : fl.toString().padStart(2, "0")}
              </div>
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                {unitsByFloor[fl].map((u) => {
                  let badgeBg = "bg-emerald-50 border-emerald-300 text-emerald-900 hover:border-emerald-500";
                  if (u.status === "RESERVED") badgeBg = "bg-amber-50 border-amber-300 text-amber-900 hover:border-amber-500";
                  if (u.status === "SOLD") badgeBg = "bg-purple-50 border-purple-300 text-purple-900 hover:border-purple-500";
                  if (u.status === "ON_HOLD") badgeBg = "bg-orange-50 border-orange-300 text-orange-900 hover:border-orange-500";

                  return (
                    <button
                      key={u.id}
                      onClick={() => setActiveUnit(u)}
                      className={`p-2.5 rounded-xl border text-left transition-all shadow-2xs hover:scale-102 ${badgeBg}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-mono text-xs font-bold">{u.unitNumber}</span>
                        <span className="text-[10px] font-semibold opacity-75">{u.bedrooms}BR</span>
                      </div>
                      <p className="text-[11px] font-bold mt-1">
                        {formatCurrency(u.finalPrice)}
                      </p>
                      <p className="text-[9px] opacity-75 truncate max-w-[120px]">{u.view || u.unitType}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {floorKeys.length === 0 && (
            <div className="py-16 text-center text-xs text-[#94A3B8]">
              No units matched current criteria.
            </div>
          )}
        </div>
      ) : (
        /* Inventory List Table */
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] uppercase font-semibold">
                  <th className="px-4 py-3">Unit #</th>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Floor</th>
                  <th className="px-4 py-3">Bed/Bath</th>
                  <th className="px-4 py-3">Area</th>
                  <th className="px-4 py-3">View</th>
                  <th className="px-4 py-3">Final Price</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {units.map((u) => (
                  <tr key={u.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[#2563EB]">
                      {u.unitNumber}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#172033]">{u.project?.name}</td>
                    <td className="px-4 py-3">{u.unitType}</td>
                    <td className="px-4 py-3 font-medium">{u.floor ?? "Ground"}</td>
                    <td className="px-4 py-3">{u.bedrooms} BR / {u.bathrooms} BA</td>
                    <td className="px-4 py-3">{u.area} sqft</td>
                    <td className="px-4 py-3 text-[#64748B]">{u.view || "-"}</td>
                    <td className="px-4 py-3 font-bold text-emerald-700">
                      {formatCurrency(u.finalPrice)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setActiveUnit(u)}
                        className="px-2.5 py-1 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] rounded text-[11px] font-semibold text-[#172033]"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Unit Inspection Modal */}
      <Modal
        open={!!activeUnit}
        onClose={() => setActiveUnit(null)}
        title={`Unit Inspection: ${activeUnit?.unitNumber}`}
        description={`${activeUnit?.project?.name} • Floor ${activeUnit?.floor}`}
        footer={
          <div className="flex items-center justify-between w-full">
            <div>
              <span className="text-[10px] text-[#94A3B8] block">Final Agreed Price</span>
              <span className="text-base font-bold text-emerald-700">
                {activeUnit ? formatCurrency(activeUnit.finalPrice) : "-"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveUnit(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] rounded-lg"
              >
                Close
              </button>
              {activeUnit?.status === "AVAILABLE" && (
                <button
                  onClick={() => {
                    const unitId = activeUnit.id;
                    setActiveUnit(null);
                    router.push(`/eoi?unitId=${unitId}`);
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-colors"
                >
                  Create EOI / Reserve Unit
                </button>
              )}
            </div>
          </div>
        }
      >
        {activeUnit && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <div>
                <span className="text-xs text-[#64748B]">Current Availability</span>
                <div className="mt-0.5">
                  <StatusBadge status={activeUnit.status} />
                </div>
              </div>
              {activeUnit.reservations?.[0] && (
                <div className="text-right">
                  <span className="text-[10px] text-[#94A3B8] block">Reserved Buyer</span>
                  <span className="text-xs font-bold text-[#172033]">
                    {activeUnit.reservations[0].buyer.companyName ||
                      `${activeUnit.reservations[0].buyer.firstName} ${activeUnit.reservations[0].buyer.lastName}`}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 border border-[#E2E8F0] rounded-lg">
                <span className="text-[#94A3B8] text-[10px] block">Unit Specs</span>
                <span className="font-semibold text-[#172033]">
                  {activeUnit.bedrooms} BR / {activeUnit.bathrooms} BA ({activeUnit.area} sqft)
                </span>
              </div>
              <div className="p-2.5 border border-[#E2E8F0] rounded-lg">
                <span className="text-[#94A3B8] text-[10px] block">Orientation & View</span>
                <span className="font-semibold text-[#172033]">{activeUnit.view || "Standard"}</span>
              </div>
            </div>

            {/* Price Itemization Table */}
            <div className="border border-[#E2E8F0] rounded-xl p-3 bg-white space-y-1.5 text-xs">
              <p className="font-bold text-[#172033] text-[11px] uppercase tracking-wider mb-2">
                Itemized Pricing Breakdown
              </p>
              <div className="flex justify-between text-[#64748B]">
                <span>Base Property Price:</span>
                <span className="font-medium text-[#172033]">{formatCurrency(activeUnit.basePrice)}</span>
              </div>
              <div className="flex justify-between text-[#64748B]">
                <span>Floor Premium (Level {activeUnit.floor}):</span>
                <span className="font-medium text-[#172033]">{formatCurrency(activeUnit.floorPremium)}</span>
              </div>
              <div className="flex justify-between text-[#64748B]">
                <span>View & Elevation Premium:</span>
                <span className="font-medium text-[#172033]">{formatCurrency(activeUnit.viewPremium)}</span>
              </div>
              <div className="flex justify-between text-[#64748B]">
                <span>Administrative / DLD Fees:</span>
                <span className="font-medium text-[#172033]">{formatCurrency(activeUnit.additionalCharges)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#E2E8F0] font-bold text-sm text-[#172033]">
                <span>Total Net Price:</span>
                <span className="text-emerald-700">{formatCurrency(activeUnit.finalPrice)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

