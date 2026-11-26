"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Boxes,
  Building2,
  Home,
  ArrowLeft,
  Pencil,
  Trash2,
  Camera,
  Film,
  FileSignature,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Calendar,
  DollarSign,
  Layers,
  Lock,
  ChevronDown,
  ChevronRight,
  Share2,
  ExternalLink,
  FileText,
  Plus,
  Play,
  Users,
  Eye,
  Check,
  Tag,
  Loader2,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { MediaUploader } from "@/components/ui/media-uploader";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PROPERTY_TYPES, UNIT_STATUSES } from "@/lib/constants";

interface UnitDetail {
  id: string;
  unitNumber: string;
  projectId: string;
  buildingId: string | null;
  floor: number | null;
  unitType: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  areaUnit?: string;
  view: string | null;
  basePrice: number;
  floorPremium: number;
  viewPremium: number;
  additionalCharges: number;
  finalPrice: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  images?: string[];
  videoUrl?: string | null;
  project: {
    id: string;
    name: string;
    code: string;
    location: string;
    city: string;
    country: string;
    address: string;
    developer: string;
    amenities: string | null;
    status: string;
  };
  building: {
    id: string;
    name: string;
    totalFloors?: number;
    totalUnits?: number;
  } | null;
  reservations: {
    id: string;
    status: string;
    depositAmount: number;
    createdAt: string;
    buyer: {
      id: string;
      firstName: string;
      lastName: string;
      companyName?: string;
      email?: string;
      phone?: string;
    };
  }[];
}

export default function UnitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const unitId = resolvedParams.id;
  const { addToast } = useToast();

  const [unit, setUnit] = useState<UnitDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "pricing" | "media" | "project" | "reservations"
  >("overview");

  // Selected Photo Viewer
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Collapsible sections state
  const [openSections, setOpenSections] = useState({
    specs: true,
    pricing: true,
    media: true,
    marketing: true,
    community: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Edit Unit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    unitNumber: "",
    unitType: "APARTMENT",
    floor: "",
    bedrooms: "",
    bathrooms: "",
    area: "",
    view: "",
    basePrice: "",
    floorPremium: "",
    viewPremium: "",
    additionalCharges: "",
    finalPrice: "",
    status: "AVAILABLE",
    images: [] as string[],
    videoUrl: "",
  });

  // Property Listing Preview Modal State
  const [showListingPreview, setShowListingPreview] = useState(false);

  const fetchUnit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/units/${unitId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load unit");
      setUnit(data.unit);
    } catch (e: any) {
      console.error(e);
      addToast("error", "Error", e.message || "Failed to load unit");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnit();
  }, [unitId]);

  const handleOpenEdit = () => {
    if (!unit) return;
    setEditForm({
      unitNumber: unit.unitNumber,
      unitType: unit.unitType,
      floor: unit.floor !== null ? String(unit.floor) : "",
      bedrooms: unit.bedrooms !== null ? String(unit.bedrooms) : "",
      bathrooms: unit.bathrooms !== null ? String(unit.bathrooms) : "",
      area: unit.area !== null ? String(unit.area) : "",
      view: unit.view || "",
      basePrice: String(unit.basePrice),
      floorPremium: String(unit.floorPremium || 0),
      viewPremium: String(unit.viewPremium || 0),
      additionalCharges: String(unit.additionalCharges || 0),
      finalPrice: String(unit.finalPrice),
      status: unit.status,
      images: unit.images || [],
      videoUrl: unit.videoUrl || "",
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unit) return;
    setSavingEdit(true);
    try {
      const payload = {
        unitNumber: editForm.unitNumber.trim(),
        unitType: editForm.unitType,
        floor: editForm.floor !== "" ? parseInt(editForm.floor, 10) : null,
        bedrooms: editForm.bedrooms !== "" ? parseInt(editForm.bedrooms, 10) : null,
        bathrooms: editForm.bathrooms !== "" ? parseInt(editForm.bathrooms, 10) : null,
        area: editForm.area !== "" ? Number(editForm.area) : null,
        view: editForm.view.trim(),
        basePrice: editForm.basePrice ? Number(editForm.basePrice) : 0,
        finalPrice: editForm.finalPrice ? Number(editForm.finalPrice) : 0,
        status: editForm.status,
        images: editForm.images.slice(0, 10),
        videoUrl: editForm.videoUrl.trim(),
      };

      const res = await fetch(`/api/units/${unit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update unit");

      addToast("success", "Unit Updated", `Unit ${editForm.unitNumber} updated successfully.`);
      setShowEditModal(false);
      fetchUnit();
    } catch (err: any) {
      addToast("error", "Update Failed", err.message || "An error occurred");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteUnit = async () => {
    if (!unit) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete Unit ${unit.unitNumber}?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/units/${unit.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete unit");

      addToast("success", "Unit Deleted", `Unit ${unit.unitNumber} has been removed.`);
      router.push("/inventory");
    } catch (err: any) {
      addToast("error", "Delete Failed", err.message || "Failed to delete unit");
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading Unit Details...</p>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-rose-600 font-bold mb-4">Unit not found.</p>
        <Link
          href="/inventory"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
        >
          Return to Inventory
        </Link>
      </div>
    );
  }

  const primaryPhoto =
    unit.images && unit.images.length > 0
      ? unit.images[selectedPhotoIndex] || unit.images[0]
      : "/images/projects/downtown-crown.jpg";

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Breadcrumb Navigation (Exact style as Leads view) */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link
          href="/inventory"
          className="hover:text-blue-600 flex items-center gap-1 font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Inventory
        </Link>
        <span>/</span>
        <Link
          href={`/projects/${unit.project?.id}`}
          className="text-slate-600 hover:text-blue-600 font-medium truncate max-w-[200px]"
        >
          {unit.project?.name}
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-bold font-mono">Unit #{unit.unitNumber}</span>
      </div>

      {/* 2. Top Header Banner Card (Exact style as Leads view) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Unit Identity & Specs */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold text-xl shrink-0 shadow-2xs">
              <Boxes className="w-7 h-7" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
                  Unit {unit.unitNumber}
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                  {unit.project?.code}
                </span>
                <StatusBadge status={unit.status} />
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200 uppercase">
                  {unit.unitType}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {unit.bedrooms} BR / {unit.bathrooms} BA
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 flex-wrap">
                <span className="flex items-center gap-1 text-slate-800 font-semibold">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {unit.project?.name}
                </span>
                {unit.building && (
                  <span className="flex items-center gap-1 text-slate-600">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    {unit.building.name}
                  </span>
                )}
                <span className="flex items-center gap-1 text-slate-600">
                  Floor: <strong className="text-slate-800">{unit.floor ?? "Ground"}</strong>
                </span>
                <span className="flex items-center gap-1 text-slate-600">
                  Area: <strong className="text-slate-800">{unit.area} SQFT</strong>
                </span>
                {unit.view && (
                  <span className="flex items-center gap-1 text-slate-600">
                    View: <strong className="text-slate-800">{unit.view}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Pricing Highlight & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:self-center">
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Final Agreed Price
              </span>
              <span className="text-2xl font-extrabold text-emerald-700 font-mono">
                {formatCurrency(unit.finalPrice)}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowListingPreview(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                title="Preview in Property Listing"
              >
                <Home className="w-3.5 h-3.5 text-blue-600" />
                <span>Property Listing</span>
              </button>

              <button
                type="button"
                onClick={handleOpenEdit}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit Unit</span>
              </button>

              <button
                type="button"
                onClick={handleDeleteUnit}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Delete Unit"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 3. Navigation Tabs (Matching Leads tab style) */}
        <div className="flex items-center gap-6 border-t border-slate-100 mt-6 pt-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "overview"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("pricing")}
            className={`pb-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "pricing"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Pricing & Commercials
          </button>
          <button
            onClick={() => setActiveTab("media")}
            className={`pb-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "media"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Media & Virtual Tour ({unit.images?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("project")}
            className={`pb-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "project"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Project & Community
          </button>
          <button
            onClick={() => setActiveTab("reservations")}
            className={`pb-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "reservations"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Buyer & Reservations ({unit.reservations?.length || 0})
          </button>
        </div>
      </div>

      {/* 4. Tab Contents */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Section 1: Unit Specifications (Matching Image 3 exact card layout) */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => toggleSection("specs")}
              className="w-full px-5 py-3.5 bg-slate-50/80 hover:bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                {openSections.specs ? (
                  <ChevronDown className="w-4 h-4 text-slate-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                )}
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Unit Information & Attributes
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-normal">
                Architectural specifications, floor elevation & orientation
              </span>
            </button>

            {openSections.specs && (
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 p-2 sm:p-4">
                {/* Left Column */}
                <div className="space-y-1 md:pr-4">
                  <div className="border-b border-slate-100 py-2.5 px-3 flex items-center justify-between min-h-[44px]">
                    <span className="text-xs font-medium text-slate-500 w-[40%]">Unit Number</span>
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {unit.unitNumber}
                    </span>
                  </div>

                  <div className="border-b border-slate-100 py-2.5 px-3 flex items-center justify-between min-h-[44px]">
                    <span className="text-xs font-medium text-slate-500 w-[40%]">Master Development</span>
                    <span className="font-semibold text-blue-700 text-xs">{unit.project?.name}</span>
                  </div>

                  <div className="border-b border-slate-100 py-2.5 px-3 flex items-center justify-between min-h-[44px]">
                    <span className="text-xs font-medium text-slate-500 w-[40%]">Building / Tower</span>
                    <span className="text-slate-800 text-xs font-medium">
                      {unit.building?.name || "Crown Tower"}
                    </span>
                  </div>

                  <div className="border-b border-slate-100 py-2.5 px-3 flex items-center justify-between min-h-[44px]">
                    <span className="text-xs font-medium text-slate-500 w-[40%]">Floor Level</span>
                    <span className="text-slate-800 text-xs font-bold font-mono">
                      {unit.floor !== null ? `Floor ${unit.floor}` : "Ground Level"}
                    </span>
                  </div>

                  <div className="border-b border-slate-100 py-2.5 px-3 flex items-center justify-between min-h-[44px]">
                    <span className="text-xs font-medium text-slate-500 w-[40%]">Property Category</span>
                    <span className="text-slate-800 text-xs font-semibold">{unit.unitType}</span>
                  </div>

                  <div className="border-b border-slate-100 py-2.5 px-3 flex items-center justify-between min-h-[44px]">
                    <span className="text-xs font-medium text-slate-500 w-[40%]">Inventory Status</span>
                    <StatusBadge status={unit.status} />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-1 md:pl-4">
                  <div className="border-b border-slate-100 py-2.5 px-3 flex items-center justify-between min-h-[44px]">
                    <span className="text-xs font-medium text-slate-500 w-[40%]">Bedrooms</span>
                    <span className="font-bold text-slate-800 text-xs">{unit.bedrooms} Bedrooms</span>
                  </div>

                  <div className="border-b border-slate-100 py-2.5 px-3 flex items-center justify-between min-h-[44px]">
                    <span className="text-xs font-medium text-slate-500 w-[40%]">Bathrooms</span>
                    <span className="text-slate-800 text-xs font-medium">{unit.bathrooms} Bathrooms</span>
                  </div>

                  <div className="border-b border-slate-100 py-2.5 px-3 flex items-center justify-between min-h-[44px]">
                    <span className="text-xs font-medium text-slate-500 w-[40%]">Built-Up Area</span>
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {unit.area} SQFT ({(Number(unit.area) * 0.0929).toFixed(1)} m²)
                    </span>
                  </div>

                  <div className="border-b border-slate-100 py-2.5 px-3 flex items-center justify-between min-h-[44px]">
                    <span className="text-xs font-medium text-slate-500 w-[40%]">View & Orientation</span>
                    <span className="text-slate-800 text-xs font-medium">{unit.view || "Prime View"}</span>
                  </div>

                  <div className="border-b border-slate-100 py-2.5 px-3 flex items-center justify-between min-h-[44px]">
                    <span className="text-xs font-medium text-slate-500 w-[40%]">Price Per Sq Ft</span>
                    <span className="font-mono text-emerald-700 font-bold text-xs">
                      {unit.area && unit.finalPrice
                        ? `AED ${Math.round(unit.finalPrice / unit.area).toLocaleString()} / sqft`
                        : "-"}
                    </span>
                  </div>

                  <div className="border-b border-slate-100 py-2.5 px-3 flex items-center justify-between min-h-[44px]">
                    <span className="text-xs font-medium text-slate-500 w-[40%]">Last Audit Date</span>
                    <span className="text-slate-500 text-xs">{formatDate(unit.updatedAt || unit.createdAt)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Itemized Commercial Pricing (Matching Image 2 exact details) */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => toggleSection("pricing")}
              className="w-full px-5 py-3.5 bg-slate-50/80 hover:bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                {openSections.pricing ? (
                  <ChevronDown className="w-4 h-4 text-slate-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                )}
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Itemized Pricing & Commercial Breakdown
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-normal">
                Base price, floor/view elevation adjustments & statutory fees
              </span>
            </button>

            {openSections.pricing && (
              <div className="p-5 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500">Base Property Price:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {formatCurrency(unit.basePrice)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500">Floor Level Premium:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {formatCurrency(unit.floorPremium || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500">View & Elevation Premium:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {formatCurrency(unit.viewPremium || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500">Administrative & DLD Fees (4%):</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {formatCurrency(unit.additionalCharges || Math.round(unit.finalPrice * 0.04))}
                      </span>
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Total Net Transaction Price
                      </span>
                      <p className="text-3xl font-extrabold text-emerald-700 font-mono mt-1">
                        {formatCurrency(unit.finalPrice)}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        Includes VAT where applicable. Compliant with Dubai Land Department (DLD) escrow standards.
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                      <span className="text-slate-600">Expected ROI (Gross Yield):</span>
                      <span className="font-bold text-blue-700">8.2% – 9.1% p.a.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Visual Imagery Gallery */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => toggleSection("media")}
              className="w-full px-5 py-3.5 bg-slate-50/80 hover:bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                {openSections.media ? (
                  <ChevronDown className="w-4 h-4 text-slate-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                )}
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Architectural Imagery & Walkthrough Tour
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-normal">
                {unit.images?.length || 0} Photos • Walkthrough Video
              </span>
            </button>

            {openSections.media && (
              <div className="p-5">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Large Hero Image */}
                  <div className="lg:col-span-2 relative h-80 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs group">
                    <Image
                      src={primaryPhoto}
                      alt={unit.unitNumber}
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-102 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-3 left-4 text-white">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-600">
                        {unit.unitNumber}
                      </span>
                      <p className="text-sm font-bold mt-1">{unit.project?.name}</p>
                      <p className="text-xs text-slate-200">{unit.view}</p>
                    </div>
                  </div>

                  {/* Thumbnail Strip & Video Link */}
                  <div className="flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Photo Gallery
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        {(unit.images && unit.images.length > 0
                          ? unit.images
                          : [primaryPhoto]
                        ).map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedPhotoIndex(idx)}
                            className={`relative h-20 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                              selectedPhotoIndex === idx
                                ? "border-blue-600 ring-2 ring-blue-200"
                                : "border-slate-200 hover:border-blue-400 opacity-80 hover:opacity-100"
                            }`}
                          >
                            <Image src={img} alt={`Thumb ${idx}`} fill unoptimized className="object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {unit.videoUrl && (
                      <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                        <div className="flex items-center gap-2 text-purple-900 font-bold text-xs mb-1">
                          <Film className="w-4 h-4 text-purple-600" />
                          Virtual Walkthrough Tour
                        </div>
                        <p className="text-[11px] text-purple-700 mb-3">
                          360-degree high-definition video walkthrough available.
                        </p>
                        <a
                          href={unit.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          Watch Video Tour
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PRICING & FINANCIALS */}
      {activeTab === "pricing" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Commercial Pricing Schedule</h3>
            <p className="text-xs text-slate-500">Complete breakdown of payment tranches and escrow allocation</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500">Base Price</span>
              <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(unit.basePrice)}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500">Floor & View Premiums</span>
              <p className="text-xl font-bold text-blue-600 mt-1">
                {formatCurrency((unit.floorPremium || 0) + (unit.viewPremium || 0))}
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500">DLD / Admin Fee</span>
              <p className="text-xl font-bold text-slate-700 mt-1">
                {formatCurrency(unit.additionalCharges || Math.round(unit.finalPrice * 0.04))}
              </p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-[10px] uppercase font-bold text-emerald-700">Total Purchase Value</span>
              <p className="text-xl font-bold text-emerald-700 mt-1 font-mono">
                {formatCurrency(unit.finalPrice)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MEDIA & VIRTUAL TOUR */}
      {activeTab === "media" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">High-Resolution Photo Gallery</h3>
              <p className="text-xs text-slate-500">Architectural renderings and interior finishes</p>
            </div>
            <button
              onClick={handleOpenEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <Camera className="w-3.5 h-3.5" />
              Manage Photos & Video
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(unit.images && unit.images.length > 0 ? unit.images : [primaryPhoto]).map(
              (img, i) => (
                <div
                  key={i}
                  className="relative h-64 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group shadow-2xs"
                >
                  <Image src={img} alt={`Photo ${i + 1}`} fill unoptimized className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-xs">
                    Photo {i + 1}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* TAB 4: PROJECT & COMMUNITY */}
      {activeTab === "project" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">{unit.project?.name}</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                {unit.project?.address}, {unit.project?.location}, {unit.project?.city}
              </p>
            </div>
            <Link
              href={`/projects/${unit.project?.id}`}
              className="px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <span>View Master Project</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 uppercase font-bold text-[10px] block">Developer</span>
              <span className="text-sm font-bold text-slate-800 mt-1 block">
                {unit.project?.developer || "Pentacloud Properties"}
              </span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 uppercase font-bold text-[10px] block">Tower / Building</span>
              <span className="text-sm font-bold text-slate-800 mt-1 block">
                {unit.building?.name || "Crown Tower"}
              </span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 uppercase font-bold text-[10px] block">Status</span>
              <span className="text-sm font-bold text-emerald-700 mt-1 block">
                {unit.project?.status || "ACTIVE"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: BUYER & RESERVATIONS */}
      {activeTab === "reservations" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Reservations & EOI Lock</h3>
              <p className="text-xs text-slate-500">Prospective buyer allocation and token lock records</p>
            </div>
          </div>

          {unit.reservations && unit.reservations.length > 0 ? (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
              {unit.reservations.map((r) => (
                <div key={r.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <span className="font-bold text-slate-900 text-sm">
                      {r.buyer.firstName} {r.buyer.lastName}
                    </span>
                    {r.buyer.companyName && (
                      <span className="text-slate-500 block">{r.buyer.companyName}</span>
                    )}
                    <span className="text-slate-400 text-[11px] block mt-0.5">
                      Reserved on {formatDate(r.createdAt)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-700 block">
                      Token Deposit: {formatCurrency(r.depositAmount)}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      {r.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No active buyer reservations or token locks on this unit. Status is <strong>AVAILABLE</strong>.
            </div>
          )}
        </div>
      )}

      {/* EDIT UNIT MODAL */}
      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edit Unit: ${unit.unitNumber}`}
        description="Update specifications, pricing, inventory status, and media assets"
        size="lg"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Unit Number</label>
              <input
                type="text"
                required
                value={editForm.unitNumber}
                onChange={(e) => setEditForm({ ...editForm, unitNumber: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {UNIT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Unit Type</label>
              <select
                value={editForm.unitType}
                onChange={(e) => setEditForm({ ...editForm, unitType: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bedrooms</label>
              <input
                type="number"
                value={editForm.bedrooms}
                onChange={(e) => setEditForm({ ...editForm, bedrooms: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bathrooms</label>
              <input
                type="number"
                value={editForm.bathrooms}
                onChange={(e) => setEditForm({ ...editForm, bathrooms: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Floor Level</label>
              <input
                type="number"
                value={editForm.floor}
                onChange={(e) => setEditForm({ ...editForm, floor: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Area (SQFT)</label>
              <input
                type="number"
                value={editForm.area}
                onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">View / Orientation</label>
              <input
                type="text"
                value={editForm.view}
                onChange={(e) => setEditForm({ ...editForm, view: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Base Price (AED)</label>
              <input
                type="number"
                value={editForm.basePrice}
                onChange={(e) => setEditForm({ ...editForm, basePrice: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Final Price (AED)</label>
              <input
                type="number"
                value={editForm.finalPrice}
                onChange={(e) => setEditForm({ ...editForm, finalPrice: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold text-emerald-700"
              />
            </div>
          </div>

          {/* Media Photos & Video */}
          <div className="pt-2">
            <MediaUploader
              images={editForm.images}
              videoUrl={editForm.videoUrl}
              onImagesChange={(imgs) => setEditForm({ ...editForm, images: imgs })}
              onVideoChange={(vUrl: string) => setEditForm({ ...editForm, videoUrl: vUrl })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingEdit}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50"
            >
              {savingEdit ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* PROPERTY LISTING PREVIEW MODAL */}
      <Modal
        open={showListingPreview}
        onClose={() => setShowListingPreview(false)}
        title={`Property Listing Preview • Unit ${unit.unitNumber}`}
        description={`Syndicated off-plan listing format for ${unit.project?.name}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="relative h-60 w-full rounded-xl overflow-hidden border border-slate-200">
            <Image src={primaryPhoto} alt={unit.unitNumber} fill unoptimized className="object-cover" />
            <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow">
              OFF-PLAN LISTING
            </div>
            <div className="absolute bottom-3 right-3 bg-black/70 text-white text-sm font-extrabold px-3 py-1 rounded-lg backdrop-blur-xs font-mono">
              {formatCurrency(unit.finalPrice)}
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900">
              {unit.bedrooms}BR {unit.unitType} with {unit.view || "Panoramic View"}
            </h3>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              {unit.project?.name}, {unit.project?.location}, {unit.project?.city}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-xs py-3 border-y border-slate-100 bg-slate-50 rounded-lg">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Bedrooms</span>
              <span className="font-bold text-slate-800">{unit.bedrooms} Beds</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Bathrooms</span>
              <span className="font-bold text-slate-800">{unit.bathrooms} Baths</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Area</span>
              <span className="font-bold text-slate-800">{unit.area} SQFT</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Floor</span>
              <span className="font-bold text-slate-800">{unit.floor ?? "Ground"}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link
              href="/listings"
              className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
            >
              <span>View in Property Listings Module</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={() => setShowListingPreview(false)}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg"
            >
              Close Preview
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
