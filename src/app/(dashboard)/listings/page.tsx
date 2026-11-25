"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Home,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  Share2,
  FileText,
  Pencil,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Eye,
  MessageSquare,
  Globe,
  Boxes,
  Copy,
  ExternalLink,
  Loader2,
  X,
  Send,
  Building2,
  ArrowUpRight,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { formatCurrency } from "@/lib/utils";

interface PropertyListingItem {
  id: string;
  reference: string;
  title: string;
  listingType: "OFF_PLAN" | "SECONDARY" | "RENTAL";
  propertyType: "PENTHOUSE" | "VILLA" | "APARTMENT" | "TOWNHOUSE";
  projectName: string;
  unitNumber: string;
  location: string;
  city: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  askingPrice: number;
  pricePerSqFt: number;
  trakheesiPermit: string;
  status: "ACTIVE" | "DRAFT" | "UNDER_OFFER" | "ARCHIVED";
  portals: {
    propertyFinder: boolean;
    bayut: boolean;
    dubizzle: boolean;
    website: boolean;
  };
  inquiriesCount: number;
  viewsCount: number;
  daysOnMarket: number;
  heroImage: string;
  features: string[];
  description: string;
  agentName: string;
  agentPhone: string;
  createdAt: string;
}

interface ListingForm {
  title: string;
  reference: string;
  listingType: "OFF_PLAN" | "SECONDARY" | "RENTAL";
  propertyType: "PENTHOUSE" | "VILLA" | "APARTMENT" | "TOWNHOUSE";
  projectName: string;
  unitNumber: string;
  location: string;
  city: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  askingPrice: number;
  trakheesiPermit: string;
  status: "ACTIVE" | "DRAFT" | "UNDER_OFFER" | "ARCHIVED";
  portals: {
    propertyFinder: boolean;
    bayut: boolean;
    dubizzle: boolean;
    website: boolean;
  };
  heroImage: string;
  features: string;
  description: string;
}

const initialListingForm: ListingForm = {
  title: "",
  reference: "",
  listingType: "OFF_PLAN",
  propertyType: "APARTMENT",
  projectName: "Downtown Heights Tower",
  unitNumber: "",
  location: "Downtown Dubai",
  city: "Dubai",
  bedrooms: 2,
  bathrooms: 2,
  area: 1450,
  askingPrice: 2450000,
  trakheesiPermit: "",
  status: "ACTIVE",
  portals: {
    propertyFinder: true,
    bayut: true,
    dubizzle: true,
    website: true,
  },
  heroImage: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
  features: "Balcony, Concierge, High ROI, Private Parking",
  description: "Bespoke residential property in prime Dubai community.",
};

export default function PropertyListingsPage() {
  const { addToast } = useToast();

  const [listings, setListings] = useState<PropertyListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Filter States
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<PropertyListingItem | null>(null);
  const [form, setForm] = useState(initialListingForm);
  const [saving, setSaving] = useState(false);

  // WhatsApp Share Dialog
  const [shareItem, setShareItem] = useState<PropertyListingItem | null>(null);
  const [factsheetItem, setFactsheetItem] = useState<PropertyListingItem | null>(null);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterType) params.set("type", filterType);
      if (filterStatus) params.set("status", filterStatus);

      const res = await fetch(`/api/listings?${params}`);
      const data = await res.json();
      setListings(data.listings || []);
    } catch {
      addToast("error", "Error", "Failed to fetch property listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [search, filterType, filterStatus]);

  const handleOpenAdd = () => {
    setEditingListing(null);
    setForm({
      ...initialListingForm,
      reference: `LST-${Math.floor(10000 + Math.random() * 90000)}`,
      trakheesiPermit: `71${Math.floor(10000000 + Math.random() * 90000000)}`,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item: PropertyListingItem) => {
    setEditingListing(item);
    setForm({
      title: item.title,
      reference: item.reference,
      listingType: item.listingType,
      propertyType: item.propertyType,
      projectName: item.projectName,
      unitNumber: item.unitNumber,
      location: item.location,
      city: item.city,
      bedrooms: item.bedrooms,
      bathrooms: item.bathrooms,
      area: item.area,
      askingPrice: item.askingPrice,
      trakheesiPermit: item.trakheesiPermit,
      status: item.status,
      portals: { ...item.portals },
      heroImage: item.heroImage,
      features: item.features.join(", "),
      description: item.description,
    });
    setModalOpen(true);
  };

  const handleSaveListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      addToast("error", "Validation Error", "Title is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        features: form.features.split(",").map((s) => s.trim()).filter(Boolean),
      };

      if (editingListing) {
        setListings((prev) =>
          prev.map((l) => (l.id === editingListing.id ? { ...l, ...payload } : l))
        );
        addToast("success", "Listing Updated", `${form.title} updated successfully.`);
      } else {
        const res = await fetch("/api/listings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create listing");
        setListings((prev) => [data.listing, ...prev]);
        addToast("success", "Listing Published", "Property listing is now active & syndicated.");
      }

      setModalOpen(false);
    } catch (err: any) {
      addToast("error", "Save Failed", err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteListing = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete listing "${title}"?`)) return;
    setListings((prev) => prev.filter((l) => l.id !== id));
    addToast("success", "Listing Deleted", "Property listing removed from catalog.");
  };

  const generateWhatsAppText = (item: PropertyListingItem) => {
    return `*${item.title}*\n\n` +
      `📍 *Location:* ${item.location}, ${item.city}\n` +
      `🏢 *Project:* ${item.projectName} (${item.unitNumber})\n` +
      `🛏️ *Bedrooms:* ${item.bedrooms} BR | 🛁 ${item.bathrooms} BA\n` +
      `📐 *Size:* ${item.area.toLocaleString()} sq. ft.\n` +
      `💰 *Asking Price:* ${formatCurrency(item.askingPrice)}\n` +
      `📜 *DLD Trakheesi Permit:* ${item.trakheesiPermit}\n\n` +
      `✨ *Key Features:* ${item.features.join(" • ")}\n\n` +
      `👤 *Exclusive Advisor:* ${item.agentName} (${item.agentPhone})\n` +
      `🔗 *Brochure Link:* https://crm.pentacloud.com/listings/${item.reference}`;
  };

  const totalPortfolioValue = listings.reduce((acc, l) => acc + l.askingPrice, 0);
  const totalInquiries = listings.reduce((acc, l) => acc + l.inquiriesCount, 0);
  const liveSyndications = listings.reduce(
    (acc, l) =>
      acc +
      (l.portals.propertyFinder ? 1 : 0) +
      (l.portals.bayut ? 1 : 0) +
      (l.portals.dubizzle ? 1 : 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <Home className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Property Listings</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Public marketing catalog, DLD Trakheesi permits, and automated syndication to Property Finder, Bayut & Dubizzle.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 transition-colors cursor-pointer ${
                viewMode === "grid" ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-50"
              }`}
              title="Grid Cards"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 transition-colors cursor-pointer ${
                viewMode === "table" ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-50"
              }`}
              title="List Table"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Listing
          </button>
        </div>
      </div>

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Active Listings</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {listings.filter((l) => l.status === "ACTIVE").length}{" "}
            <span className="text-xs font-normal text-slate-400">/ {listings.length} Total</span>
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">Ready for public syndication</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Portfolio Marketing Value</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalPortfolioValue)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Gross active asking value</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Live Portal Endpoints</span>
            <Globe className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{liveSyndications}</p>
          <p className="text-[11px] text-slate-400 mt-1">Property Finder, Bayut, Dubizzle</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Inbound Inquiries</span>
            <MessageSquare className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalInquiries}</p>
          <p className="text-[11px] text-slate-400 mt-1">Buyer inquiries across portals</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, reference, project, location..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="text-xs font-medium border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 text-slate-800"
        >
          <option value="">All Listing Types</option>
          <option value="OFF_PLAN">Off-Plan</option>
          <option value="SECONDARY">Resale / Secondary</option>
          <option value="RENTAL">Rental</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-xs font-medium border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 text-slate-800"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active / Published</option>
          <option value="UNDER_OFFER">Under Offer</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {/* Main View: Grid Cards or Table */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading Property Listings...</div>
      ) : listings.length === 0 ? (
        <div className="py-20 text-center text-xs text-slate-400">
          No property listings found matching criteria.
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
            >
              {/* Hero Image & Top Badges */}
              <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                <Image
                  src={item.heroImage}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-600 text-white shadow-xs">
                    {item.listingType.replace("_", " ")}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/90 backdrop-blur-xs text-slate-800 shadow-xs">
                    {item.propertyType}
                  </span>
                </div>

                <div className="absolute top-3 right-3">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      item.status === "ACTIVE"
                        ? "bg-emerald-500 text-white"
                        : item.status === "UNDER_OFFER"
                        ? "bg-amber-500 text-white"
                        : "bg-slate-700 text-white"
                    }`}
                  >
                    {item.status.replace("_", " ")}
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="text-[10px] font-mono opacity-80 block">{item.reference}</span>
                  <p className="text-base font-bold tracking-tight line-clamp-1">{item.title}</p>
                </div>
              </div>

              {/* Card Body Details */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="truncate">{item.projectName} • {item.unitNumber}</span>
                  <span className="font-semibold text-slate-700 shrink-0">{item.location}</span>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Bed / Bath</span>
                    <span className="font-bold text-slate-800">{item.bedrooms} BR / {item.bathrooms} BA</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Built Area</span>
                    <span className="font-bold text-slate-800">{item.area.toLocaleString()} sqft</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Price / sqft</span>
                    <span className="font-bold text-blue-600">AED {item.pricePerSqFt}</span>
                  </div>
                </div>

                {/* Asking Price & DLD Permit */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Asking Price</span>
                    <span className="text-lg font-bold text-emerald-700">
                      {formatCurrency(item.askingPrice)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block flex items-center gap-1 justify-end">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> Trakheesi Permit
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-700">
                      #{item.trakheesiPermit}
                    </span>
                  </div>
                </div>

                {/* Live Portal Syndication Pills */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Syndication:</span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        item.portals.propertyFinder
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      PF {item.portals.propertyFinder && "✓"}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        item.portals.bayut
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      Bayut {item.portals.bayut && "✓"}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        item.portals.dubizzle
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      Dubizzle {item.portals.dubizzle && "✓"}
                    </span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="grid grid-cols-4 gap-1.5 pt-2">
                  <button
                    onClick={() => setShareItem(item)}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-emerald-200"
                    title="Share via WhatsApp"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share
                  </button>
                  <button
                    onClick={() => setFactsheetItem(item)}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-blue-200"
                    title="View Factsheet"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Flyer
                  </button>
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-slate-200"
                    title="Edit Listing"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteListing(item.id, item.title)}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 hover:bg-red-50 text-red-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-transparent hover:border-red-200"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table List View */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase">
                  <th className="px-4 py-3">Property</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Specs</th>
                  <th className="px-4 py-3">Asking Price</th>
                  <th className="px-4 py-3">Trakheesi Permit</th>
                  <th className="px-4 py-3">Portal Syndication</th>
                  <th className="px-4 py-3">Inquiries</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listings.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-slate-100 relative">
                          <Image src={l.heroImage} alt="" fill sizes="40px" className="object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 max-w-[220px] truncate">{l.title}</p>
                          <span className="text-[11px] text-slate-500 font-mono">{l.reference} • {l.location}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize">{l.propertyType.toLowerCase()}</td>
                    <td className="px-4 py-3">{l.bedrooms} BR • {l.area} sqft</td>
                    <td className="px-4 py-3 font-bold text-emerald-700">{formatCurrency(l.askingPrice)}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">#{l.trakheesiPermit}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-[10px] font-bold">
                        <span className={l.portals.propertyFinder ? "text-red-600" : "text-slate-300"}>PF</span>
                        <span>•</span>
                        <span className={l.portals.bayut ? "text-emerald-600" : "text-slate-300"}>Bayut</span>
                        <span>•</span>
                        <span className={l.portals.dubizzle ? "text-rose-600" : "text-slate-300"}>Dubizzle</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-blue-600">{l.inquiriesCount} Leads</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setShareItem(l)}
                          className="p-1 text-slate-400 hover:text-emerald-600 rounded"
                          title="Share"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(l)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteListing(l.id, l.title)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Add / Edit Listing Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingListing ? `Edit Listing: ${editingListing.reference}` : "Create Public Property Listing"}
        description="Publish properties to external marketing channels with DLD Trakheesi regulatory verification."
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="listing-form"
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {editingListing ? "Save Changes" : "Publish Listing"}
            </button>
          </div>
        }
      >
        <form id="listing-form" onSubmit={handleSaveListing} className="space-y-4 py-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Marketing Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Ultra-Luxury 4BR Sky Penthouse with Direct Burj Khalifa View"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Listing Type</label>
              <select
                value={form.listingType}
                onChange={(e) => setForm({ ...form, listingType: e.target.value as any })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                <option value="OFF_PLAN">Off-Plan Development</option>
                <option value="SECONDARY">Resale / Secondary</option>
                <option value="RENTAL">Rental / Lease</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Property Type</label>
              <select
                value={form.propertyType}
                onChange={(e) => setForm({ ...form, propertyType: e.target.value as any })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                <option value="APARTMENT">Apartment</option>
                <option value="PENTHOUSE">Penthouse</option>
                <option value="VILLA">Villa</option>
                <option value="TOWNHOUSE">Townhouse</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Asking Price (AED)</label>
              <input
                type="number"
                required
                value={form.askingPrice}
                onChange={(e) => setForm({ ...form, askingPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-bold text-emerald-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bedrooms</label>
              <input
                type="number"
                value={form.bedrooms}
                onChange={(e) => setForm({ ...form, bedrooms: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bathrooms</label>
              <input
                type="number"
                value={form.bathrooms}
                onChange={(e) => setForm({ ...form, bathrooms: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Built-Up Area (sq. ft.)</label>
              <input
                type="number"
                value={form.area}
                onChange={(e) => setForm({ ...form, area: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">DLD Trakheesi Permit #</label>
              <input
                type="text"
                value={form.trakheesiPermit}
                onChange={(e) => setForm({ ...form, trakheesiPermit: e.target.value })}
                placeholder="e.g. 7192840192"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Community / Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Project Name</label>
              <input
                type="text"
                value={form.projectName}
                onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          {/* Portal Syndication Checkboxes */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="text-xs font-bold text-slate-800 block">Syndicate & Publish to Portals:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.portals.propertyFinder}
                  onChange={(e) => setForm({ ...form, portals: { ...form.portals, propertyFinder: e.target.checked } })}
                  className="rounded text-blue-600"
                />
                Property Finder
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.portals.bayut}
                  onChange={(e) => setForm({ ...form, portals: { ...form.portals, bayut: e.target.checked } })}
                  className="rounded text-blue-600"
                />
                Bayut
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.portals.dubizzle}
                  onChange={(e) => setForm({ ...form, portals: { ...form.portals, dubizzle: e.target.checked } })}
                  className="rounded text-blue-600"
                />
                Dubizzle
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.portals.website}
                  onChange={(e) => setForm({ ...form, portals: { ...form.portals, website: e.target.checked } })}
                  className="rounded text-blue-600"
                />
                Company Web
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Features (comma separated)</label>
            <input
              type="text"
              value={form.features}
              onChange={(e) => setForm({ ...form, features: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Marketing Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg resize-none"
            />
          </div>
        </form>
      </Modal>

      {/* WhatsApp Share Preview Modal */}
      <Modal
        open={!!shareItem}
        onClose={() => setShareItem(null)}
        title="Share Listing via WhatsApp"
        description="Formatted luxury property pitch ready to send to prospective investors or buyers."
        size="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              onClick={() => {
                if (shareItem) {
                  navigator.clipboard.writeText(generateWhatsAppText(shareItem));
                  addToast("success", "Copied", "WhatsApp message copied to clipboard.");
                }
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy Text
            </button>

            <button
              onClick={() => {
                if (shareItem) {
                  const text = encodeURIComponent(generateWhatsAppText(shareItem));
                  window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
                  setShareItem(null);
                }
              }}
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              Open in WhatsApp
            </button>
          </div>
        }
      >
        {shareItem && (
          <div className="space-y-3">
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center justify-between">
              <span className="font-semibold">{shareItem.title}</span>
              <span className="font-bold">{formatCurrency(shareItem.askingPrice)}</span>
            </div>

            <textarea
              rows={9}
              readOnly
              value={generateWhatsAppText(shareItem)}
              className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl resize-none select-all text-slate-700 leading-relaxed"
            />
          </div>
        )}
      </Modal>

      {/* Factsheet / Flyer Preview Modal */}
      <Modal
        open={!!factsheetItem}
        onClose={() => setFactsheetItem(null)}
        title={`Fact Sheet: ${factsheetItem?.reference}`}
        description="Client-ready 1-page investment summary with verified DLD Trakheesi permit."
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              onClick={() => setFactsheetItem(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => {
                window.print();
              }}
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs cursor-pointer"
            >
              Print / Save PDF Flyer
            </button>
          </div>
        }
      >
        {factsheetItem && (
          <div className="space-y-4 p-2 bg-white">
            <div className="relative h-56 w-full rounded-xl overflow-hidden">
              <Image src={factsheetItem.heroImage} alt="" fill sizes="(max-width: 768px) 100vw, 800px" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="text-[10px] uppercase font-bold tracking-widest text-blue-300">
                  {factsheetItem.projectName} • {factsheetItem.location}
                </span>
                <h3 className="text-xl font-bold">{factsheetItem.title}</h3>
                <p className="text-lg font-bold text-emerald-400 mt-1">
                  {formatCurrency(factsheetItem.askingPrice)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 text-center text-xs p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Type</span>
                <span className="font-bold text-slate-800">{factsheetItem.propertyType}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Bedrooms</span>
                <span className="font-bold text-slate-800">{factsheetItem.bedrooms} BR</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Bathrooms</span>
                <span className="font-bold text-slate-800">{factsheetItem.bathrooms} BA</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Area</span>
                <span className="font-bold text-slate-800">{factsheetItem.area} sqft</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-900 block">Property Overview</span>
              <p className="text-xs text-slate-600 leading-relaxed">{factsheetItem.description}</p>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2">
              {factsheetItem.features.map((f, i) => (
                <span key={i} className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-semibold rounded-md">
                  {f}
                </span>
              ))}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <span className="font-bold text-slate-800 block">DLD Trakheesi Verified Permit</span>
                  <span className="text-[11px] text-slate-500 font-mono">Permit #{factsheetItem.trakheesiPermit}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-800 block">{factsheetItem.agentName}</span>
                <span className="text-[11px] text-slate-500">{factsheetItem.agentPhone}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
