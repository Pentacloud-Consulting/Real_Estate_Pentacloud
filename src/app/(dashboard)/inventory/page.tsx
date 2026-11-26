"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Boxes,
  Building2,
  LayoutGrid,
  List,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  FileSignature,
  Camera,
  Film,
  Play,
  ExternalLink,
  Home,
  Share2,
  ShieldCheck,
  Copy,
  Send,
  Check,
  Globe,
} from "lucide-react";
import Image from "next/image";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { MediaUploader } from "@/components/ui/media-uploader";
import { formatCurrency } from "@/lib/utils";
import { UNIT_STATUSES, PROPERTY_TYPES } from "@/lib/constants";

interface ProjectOption {
  id: string;
  name: string;
  code: string;
  buildings?: { id: string; name: string }[];
}

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
  images?: string[];
  videoUrl?: string | null;
  project: { id: string; name: string; code: string };
  building: { id: string; name: string } | null;
  reservations: { buyer: { firstName: string; lastName: string; companyName: string } }[];
}

interface UnitForm {
  unitNumber: string;
  projectId: string;
  buildingId: string;
  floor: string;
  unitType: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  view: string;
  basePrice: string;
  finalPrice: string;
  status: string;
  images: string[];
  videoUrl: string;
}

const initialUnitForm: UnitForm = {
  unitNumber: "",
  projectId: "",
  buildingId: "",
  floor: "1",
  unitType: "APARTMENT",
  bedrooms: "2",
  bathrooms: "2",
  area: "1200",
  view: "Community View",
  basePrice: "1500000",
  finalPrice: "1500000",
  status: "AVAILABLE",
  images: [],
  videoUrl: "",
};

export default function InventoryPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [units, setUnits] = useState<UnitItem[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"matrix" | "list">("list");

  // Filters
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedBedrooms, setSelectedBedrooms] = useState("");

  // Inspection modal
  const [activeUnit, setActiveUnit] = useState<UnitItem | null>(null);

  // Unit Create / Edit Modal
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitItem | null>(null);
  const [unitForm, setUnitForm] = useState<UnitForm>(initialUnitForm);
  const [savingUnit, setSavingUnit] = useState(false);
  const [deletingUnitId, setDeletingUnitId] = useState<string | null>(null);

  // Property Listing Preview Modal
  const [previewListingUnit, setPreviewListingUnit] = useState<UnitItem | null>(null);
  const [copiedListingText, setCopiedListingText] = useState(false);

  const handlePreviewPropertyListing = async (u: UnitItem) => {
    setPreviewListingUnit(u);
    try {
      const area = u.area || 1200;
      const askingPrice = u.finalPrice || u.basePrice || 1500000;
      const title = `${u.bedrooms || 2}BR Luxury ${u.unitType?.toLowerCase() || "residence"} with ${u.view || "panoramic view"} at ${u.project?.name || "Development"}`;
      await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          reference: `LST-${u.unitNumber.replace(/[^a-zA-Z0-9]/g, "")}`,
          projectName: u.project?.name || "Development",
          unitNumber: u.unitNumber,
          propertyType: u.unitType || "APARTMENT",
          listingType: "OFF_PLAN",
          location: "Dubai",
          city: "Dubai",
          bedrooms: u.bedrooms || 2,
          bathrooms: u.bathrooms || 2,
          area,
          askingPrice,
          trakheesiPermit: `71${Math.floor(10000000 + Math.random() * 90000000)}`,
          status: "ACTIVE",
          heroImage: u.images && u.images.length > 0 ? u.images[0] : "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
          features: [u.view || "Community View", "Private Balcony", "Central AC", "Covered Parking"],
          description: `Exceptional ${u.bedrooms || 2}-bedroom ${u.unitType?.toLowerCase() || "apartment"} in ${u.project?.name || "Development"}. Features ${u.area || 1200} sq. ft. of luxury living space with ${u.view || "skyline view"}.`,
        }),
      });
    } catch {
      // quiet sync error
    }
  };

  // Fetch available projects for dropdown
  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data.projects || []);
    } catch {
      console.error("Failed to fetch projects");
    }
  };

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
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchUnits();
  }, [selectedProject, selectedStatus, selectedBedrooms]);

  // Open Add Unit Modal
  const handleOpenAddUnitModal = () => {
    setEditingUnit(null);
    const defaultProjectId = selectedProject || (projects.length > 0 ? projects[0].id : "");
    setUnitForm({
      ...initialUnitForm,
      projectId: defaultProjectId,
    });
    setUnitModalOpen(true);
  };

  // Open Edit Unit Modal
  const handleOpenEditUnitModal = (u: UnitItem) => {
    setEditingUnit(u);
    setUnitForm({
      unitNumber: u.unitNumber || "",
      projectId: u.projectId || "",
      buildingId: u.buildingId || "",
      floor: u.floor !== null ? String(u.floor) : "",
      unitType: u.unitType || "APARTMENT",
      bedrooms: u.bedrooms !== null ? String(u.bedrooms) : "1",
      bathrooms: u.bathrooms !== null ? String(u.bathrooms) : "1",
      area: u.area !== null ? String(u.area) : "",
      view: u.view || "",
      basePrice: u.basePrice !== null ? String(u.basePrice) : "",
      finalPrice: u.finalPrice !== null ? String(u.finalPrice) : "",
      status: u.status || "AVAILABLE",
      images: Array.isArray(u.images) ? u.images : [],
      videoUrl: u.videoUrl || "",
    });
    setActiveUnit(null); // Close inspection modal if open
    setUnitModalOpen(true);
  };

  // Save Unit (Create or Update)
  const handleSaveUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitForm.unitNumber.trim()) {
      addToast("error", "Validation Error", "Unit Number is required");
      return;
    }
    if (!unitForm.projectId) {
      addToast("error", "Validation Error", "Please select a Project");
      return;
    }

    setSavingUnit(true);
    try {
      const payload = {
        unitNumber: unitForm.unitNumber.trim(),
        projectId: unitForm.projectId,
        buildingId: unitForm.buildingId || null,
        floor: unitForm.floor ? parseInt(unitForm.floor, 10) : 1,
        unitType: unitForm.unitType,
        bedrooms: unitForm.bedrooms ? parseInt(unitForm.bedrooms, 10) : 1,
        bathrooms: unitForm.bathrooms ? parseInt(unitForm.bathrooms, 10) : 1,
        area: unitForm.area ? Number(unitForm.area) : null,
        view: unitForm.view.trim() || null,
        basePrice: unitForm.basePrice ? Number(unitForm.basePrice) : 0,
        finalPrice: unitForm.finalPrice
          ? Number(unitForm.finalPrice)
          : unitForm.basePrice
          ? Number(unitForm.basePrice)
          : 0,
        status: unitForm.status,
        images: unitForm.images.slice(0, 10),
        videoUrl: unitForm.videoUrl.trim(),
      };

      if (editingUnit) {
        const res = await fetch(`/api/units/${editingUnit.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update unit");
        addToast("success", "Unit Updated", `Unit ${unitForm.unitNumber} updated successfully.`);
      } else {
        const res = await fetch("/api/units", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create unit");
        addToast("success", "Unit Created", `Unit ${unitForm.unitNumber} added to inventory.`);
      }

      setUnitModalOpen(false);
      fetchUnits();
    } catch (err: any) {
      addToast("error", "Save Failed", err.message || "An error occurred");
    } finally {
      setSavingUnit(false);
    }
  };

  // Delete Unit
  const handleDeleteUnit = async (u: UnitItem) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete unit "${u.unitNumber}" from ${u.project?.name || "the project"}?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingUnitId(u.id);
    try {
      const res = await fetch(`/api/units/${u.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete unit");

      addToast("success", "Unit Deleted", `Unit ${u.unitNumber} removed from inventory.`);
      if (activeUnit?.id === u.id) setActiveUnit(null);
      fetchUnits();
    } catch (err: any) {
      addToast("error", "Delete Failed", err.message || "An error occurred while deleting unit");
    } finally {
      setDeletingUnitId(null);
    }
  };

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
              className={`p-2 transition-colors cursor-pointer ${
                viewMode === "matrix" ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-50"
              }`}
              title="Floor Matrix View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 transition-colors cursor-pointer ${
                viewMode === "list" ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-50"
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleOpenAddUnitModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Unit
          </button>

          <button
            onClick={() => router.push("/eoi")}
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <FileSignature className="w-4 h-4 text-blue-600" />
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
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.code})
            </option>
          ))}
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

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading Inventory Units...</div>
      ) : viewMode === "matrix" ? (
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
                  if (u.status === "BLOCKED") badgeBg = "bg-red-50 border-red-300 text-red-900 hover:border-red-500";

                  return (
                    <button
                      key={u.id}
                      onClick={() => router.push(`/inventory/${u.id}`)}
                      className={`p-2.5 rounded-xl border text-left transition-all shadow-2xs hover:scale-102 cursor-pointer ${badgeBg}`}
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
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {units.map((u) => (
                  <tr key={u.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => router.push(`/inventory/${u.id}`)}
                          className="font-mono font-bold text-[#2563EB] hover:text-blue-800 hover:underline cursor-pointer text-left"
                        >
                          {u.unitNumber}
                        </button>
                        {u.images && u.images.length > 0 && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-0.5" title={`${u.images.length} photos`}>
                            <Camera className="w-3 h-3 text-blue-500" />
                            {u.images.length}
                          </span>
                        )}
                        {u.videoUrl && (
                          <span className="text-[10px] text-purple-600 flex items-center" title="Walkthrough video available">
                            <Film className="w-3 h-3" />
                          </span>
                        )}
                      </div>
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
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handlePreviewPropertyListing(u)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded text-[11px] font-semibold transition-colors cursor-pointer shrink-0"
                          title="Preview in Property Listing"
                        >
                          <Home className="w-3.5 h-3.5 text-blue-600" />
                          Property Listing
                        </button>
                        <button
                          onClick={() => router.push(`/inventory/${u.id}`)}
                          className="px-2.5 py-1 bg-white border border-[#E2E8F0] hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 rounded text-[11px] font-semibold text-[#172033] transition-colors cursor-pointer"
                        >
                          Inspect
                        </button>
                        <button
                          onClick={() => handleOpenEditUnitModal(u)}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                          title="Edit Unit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUnit(u)}
                          disabled={deletingUnitId === u.id}
                          className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer disabled:opacity-50"
                          title="Delete Unit"
                        >
                          {deletingUnitId === u.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
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
              {activeUnit && (
                <>
                  <button
                    onClick={() => {
                      const target = activeUnit;
                      setActiveUnit(null);
                      handlePreviewPropertyListing(target);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Home className="w-3.5 h-3.5 text-blue-600" />
                    Property Listing
                  </button>
                  <button
                    onClick={() => handleOpenEditUnitModal(activeUnit)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit Unit
                  </button>
                  <button
                    onClick={() => handleDeleteUnit(activeUnit)}
                    disabled={deletingUnitId === activeUnit.id}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {deletingUnitId === activeUnit.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    Delete
                  </button>
                </>
              )}
              {activeUnit?.status === "AVAILABLE" && (
                <button
                  onClick={() => {
                    const unitId = activeUnit.id;
                    setActiveUnit(null);
                    router.push(`/eoi?unitId=${unitId}`);
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
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
                    {activeUnit.reservations[0].buyer?.companyName ||
                      `${activeUnit.reservations[0].buyer?.firstName || ""} ${activeUnit.reservations[0].buyer?.lastName || ""}`}
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

            {/* Media Gallery (Up to 10 photos & 1 video) */}
            {((activeUnit.images && activeUnit.images.length > 0) || activeUnit.videoUrl) && (
              <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-blue-600" />
                    Unit Photos ({activeUnit.images?.length || 0}/10)
                  </span>
                  {activeUnit.videoUrl && (
                    <span className="text-[11px] font-semibold text-purple-600 flex items-center gap-1">
                      <Film className="w-3.5 h-3.5" />
                      Video Walkthrough Available
                    </span>
                  )}
                </div>

                {activeUnit.images && activeUnit.images.length > 0 && (
                  <div className="grid grid-cols-5 gap-2 pt-1">
                    {activeUnit.images.map((img, i) => (
                      <div key={i} className="relative aspect-4/3 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                        <Image src={img} alt="" fill unoptimized sizes="100px" className="object-cover" />
                        {i === 0 && (
                          <span className="absolute top-1 left-1 px-1 py-0.2 rounded text-[8px] font-bold bg-blue-600 text-white">
                            Cover
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {activeUnit.videoUrl && (
                  <div className="pt-2">
                    {activeUnit.videoUrl.startsWith("data:video") || activeUnit.videoUrl.endsWith(".mp4") ? (
                      <video src={activeUnit.videoUrl} controls className="w-full max-h-44 rounded-lg bg-black" />
                    ) : (
                      <a
                        href={activeUnit.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-purple-600 hover:underline font-semibold"
                      >
                        Watch Video Walkthrough <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add / Edit Unit Modal */}
      <Modal
        open={unitModalOpen}
        onClose={() => setUnitModalOpen(false)}
        title={editingUnit ? `Edit Unit: ${editingUnit.unitNumber}` : "Add New Inventory Unit"}
        description={
          editingUnit
            ? "Update unit specifications, floor level, view, and pricing."
            : "Add a newly released residential or commercial unit into project inventory."
        }
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setUnitModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="unit-form"
              disabled={savingUnit}
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {savingUnit && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {editingUnit ? "Save Changes" : "Create Unit"}
            </button>
          </div>
        }
      >
        <form id="unit-form" onSubmit={handleSaveUnit} className="space-y-4 py-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Development Project <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={unitForm.projectId}
                onChange={(e) => setUnitForm({ ...unitForm, projectId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                <option value="">-- Select Project --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={unitForm.unitNumber}
                onChange={(e) => setUnitForm({ ...unitForm, unitNumber: e.target.value })}
                placeholder="e.g. MTE-0402"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Floor Level</label>
              <input
                type="number"
                value={unitForm.floor}
                onChange={(e) => setUnitForm({ ...unitForm, floor: e.target.value })}
                placeholder="e.g. 4"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Property Type</label>
              <select
                value={unitForm.unitType}
                onChange={(e) => setUnitForm({ ...unitForm, unitType: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                {PROPERTY_TYPES.map((pt) => (
                  <option key={pt.value} value={pt.value}>
                    {pt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bedrooms</label>
              <input
                type="number"
                value={unitForm.bedrooms}
                onChange={(e) => setUnitForm({ ...unitForm, bedrooms: e.target.value })}
                placeholder="e.g. 2"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bathrooms</label>
              <input
                type="number"
                value={unitForm.bathrooms}
                onChange={(e) => setUnitForm({ ...unitForm, bathrooms: e.target.value })}
                placeholder="e.g. 2"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Area (sq. ft.)</label>
              <input
                type="number"
                value={unitForm.area}
                onChange={(e) => setUnitForm({ ...unitForm, area: e.target.value })}
                placeholder="e.g. 1450"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Orientation & View</label>
              <input
                type="text"
                value={unitForm.view}
                onChange={(e) => setUnitForm({ ...unitForm, view: e.target.value })}
                placeholder="e.g. Marina Yacht Club View"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Availability Status</label>
              <select
                value={unitForm.status}
                onChange={(e) => setUnitForm({ ...unitForm, status: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                {UNIT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Base Price (AED)</label>
              <input
                type="number"
                value={unitForm.basePrice}
                onChange={(e) => {
                  const val = e.target.value;
                  setUnitForm({
                    ...unitForm,
                    basePrice: val,
                    finalPrice: unitForm.finalPrice === unitForm.basePrice ? val : unitForm.finalPrice,
                  });
                }}
                placeholder="e.g. 1750000"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Final Net Price (AED)</label>
              <input
                type="number"
                value={unitForm.finalPrice}
                onChange={(e) => setUnitForm({ ...unitForm, finalPrice: e.target.value })}
                placeholder="e.g. 1850000"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-bold text-emerald-700"
              />
            </div>
          </div>

          {/* Media Gallery Uploader: 10 Images & 1 Walkthrough Video */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Unit Photos & Walkthrough Video (Limit: 10 Images & 1 Video)
            </label>
            <MediaUploader
              images={unitForm.images}
              onImagesChange={(imgs) => setUnitForm({ ...unitForm, images: imgs })}
              videoUrl={unitForm.videoUrl}
              onVideoChange={(v) => setUnitForm({ ...unitForm, videoUrl: v })}
              maxImages={10}
            />
          </div>
        </form>
      </Modal>

      {/* Property Listing Preview Modal */}
      <Modal
        open={!!previewListingUnit}
        onClose={() => setPreviewListingUnit(null)}
        title={`Property Listing Preview: ${previewListingUnit?.unitNumber}`}
        description={`${previewListingUnit?.project?.name} • Live Marketing & Portal Syndication Presentation`}
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              onClick={() => {
                if (previewListingUnit) {
                  const text = `*${previewListingUnit.project?.name} - Unit #${previewListingUnit.unitNumber}*\n` +
                    `📍 Location: Dubai, UAE\n` +
                    `🛏️ ${previewListingUnit.bedrooms} BR | 🛁 ${previewListingUnit.bathrooms} BA | 📐 ${previewListingUnit.area} sqft\n` +
                    `💰 Price: ${formatCurrency(previewListingUnit.finalPrice)}\n` +
                    `📜 DLD Trakheesi Permit: #7184920184\n` +
                    `🔗 Portal Listing: https://crm.pentacloud.com/listings`;
                  navigator.clipboard.writeText(text);
                  setCopiedListingText(true);
                  addToast("success", "Copied", "Listing text copied for WhatsApp.");
                  setTimeout(() => setCopiedListingText(false), 2000);
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              {copiedListingText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedListingText ? "Copied Pitch" : "Copy WhatsApp Pitch"}
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewListingUnit(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setPreviewListingUnit(null);
                  router.push("/listings");
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer transition-colors"
              >
                <Home className="w-3.5 h-3.5" />
                Open in Property Listings Module
              </button>
            </div>
          </div>
        }
      >
        {previewListingUnit && (
          <div className="space-y-4 p-1">
            {/* Hero Image & Badges */}
            <div className="relative h-48 w-full rounded-xl overflow-hidden bg-slate-900">
              <Image
                src={
                  previewListingUnit.images && previewListingUnit.images.length > 0
                    ? previewListingUnit.images[0]
                    : "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80"
                }
                alt={previewListingUnit.unitNumber}
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, 800px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-600 text-white">
                  {previewListingUnit.unitType}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/90 text-slate-800">
                  Unit #{previewListingUnit.unitNumber}
                </span>
              </div>
              <div className="absolute top-3 right-3">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500 text-white">
                  {previewListingUnit.status}
                </span>
              </div>
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <span className="text-[10px] font-mono opacity-80 block">{previewListingUnit.project?.name}</span>
                <p className="text-base font-bold tracking-tight line-clamp-1">
                  Luxury {previewListingUnit.bedrooms}BR Residence with {previewListingUnit.view || "Community View"}
                </p>
              </div>
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-4 gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Bed / Bath</span>
                <span className="font-bold text-slate-800">
                  {previewListingUnit.bedrooms} BR / {previewListingUnit.bathrooms} BA
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Built Area</span>
                <span className="font-bold text-slate-800">{previewListingUnit.area} sqft</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Floor Level</span>
                <span className="font-bold text-slate-800">Floor {previewListingUnit.floor ?? "G"}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Asking Price</span>
                <span className="font-bold text-emerald-700">
                  {formatCurrency(previewListingUnit.finalPrice)}
                </span>
              </div>
            </div>

            {/* DLD Trakheesi Permit & Regulatory Verification */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold text-emerald-950 block">DLD Trakheesi Marketing Permit</span>
                  <span className="text-[11px] text-emerald-700 font-mono">
                    Permit #7184920184 • RERA & DLD Verified
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                Verified
              </span>
            </div>

            {/* Portal Syndication Feeds Status */}
            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
              <span className="text-xs font-bold text-slate-800 block">Live Portal Syndication Status:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2 bg-red-50/60 border border-red-200 rounded-lg flex items-center justify-between">
                  <span className="font-semibold text-red-900">Property Finder</span>
                  <span className="text-[10px] font-bold text-emerald-600">Live ✓</span>
                </div>
                <div className="p-2 bg-emerald-50/60 border border-emerald-200 rounded-lg flex items-center justify-between">
                  <span className="font-semibold text-emerald-900">Bayut</span>
                  <span className="text-[10px] font-bold text-emerald-600">Live ✓</span>
                </div>
                <div className="p-2 bg-rose-50/60 border border-rose-200 rounded-lg flex items-center justify-between">
                  <span className="font-semibold text-rose-900">Dubizzle</span>
                  <span className="text-[10px] font-bold text-emerald-600">Live ✓</span>
                </div>
                <div className="p-2 bg-blue-50/60 border border-blue-200 rounded-lg flex items-center justify-between">
                  <span className="font-semibold text-blue-900">Pentacloud Web</span>
                  <span className="text-[10px] font-bold text-emerald-600">Live ✓</span>
                </div>
              </div>
            </div>

            {/* Photos Strip */}
            {previewListingUnit.images && previewListingUnit.images.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-800 block">
                  Listing Photo Gallery ({previewListingUnit.images.length}/10)
                </span>
                <div className="grid grid-cols-5 gap-2">
                  {previewListingUnit.images.map((img, i) => (
                    <div key={i} className="relative aspect-4/3 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                      <Image src={img} alt="" fill unoptimized sizes="100px" className="object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
