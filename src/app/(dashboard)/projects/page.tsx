"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  MapPin,
  ArrowRight,
  Plus,
  Boxes,
  Pencil,
  Trash2,
  Loader2,
  Camera,
  Film,
} from "lucide-react";
import Image from "next/image";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { MediaUploader } from "@/components/ui/media-uploader";
import { formatCurrency } from "@/lib/utils";
import { PROJECT_STATUSES, PROPERTY_TYPES } from "@/lib/constants";

interface ProjectItem {
  id: string;
  name: string;
  code: string;
  developer: string;
  description: string | null;
  location: string;
  city: string;
  country: string;
  status: string;
  propertyType: string;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
  totalUnits: number;
  amenities: string | null;
  images?: string[];
  videoUrl?: string | null;
  buildings?: { id: string; name: string }[];
  _count?: { units: number; opportunities: number };
}

interface ProjectForm {
  name: string;
  code: string;
  developer: string;
  description: string;
  location: string;
  city: string;
  country: string;
  status: string;
  propertyType: string;
  priceRangeMin: string;
  priceRangeMax: string;
  totalUnits: string;
  amenities: string;
  images: string[];
  videoUrl: string;
}

const initialForm: ProjectForm = {
  name: "",
  code: "",
  developer: "Pentacloud Properties",
  description: "",
  location: "Downtown Dubai",
  city: "Dubai",
  country: "UAE",
  status: "ACTIVE",
  propertyType: "APARTMENT",
  priceRangeMin: "",
  priceRangeMax: "",
  totalUnits: "",
  amenities: "Swimming Pool, Gymnasium, Valet Parking, Concierge Service",
  images: [],
  videoUrl: "",
};

export default function ProjectsPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [form, setForm] = useState<ProjectForm>(initialForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data.projects || []);
    } catch {
      addToast("error", "Error", "Failed to fetch development projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleOpenAddModal = () => {
    setEditingProject(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const handleOpenEditModal = (p: ProjectItem) => {
    setEditingProject(p);
    let amenitiesStr = "";
    if (p.amenities) {
      try {
        const parsed = JSON.parse(p.amenities);
        amenitiesStr = Array.isArray(parsed) ? parsed.join(", ") : p.amenities;
      } catch {
        amenitiesStr = p.amenities;
      }
    }
    setForm({
      name: p.name || "",
      code: p.code || "",
      developer: p.developer || "Pentacloud Properties",
      description: p.description || "",
      location: p.location || "Downtown Dubai",
      city: p.city || "Dubai",
      country: p.country || "UAE",
      status: p.status || "ACTIVE",
      propertyType: p.propertyType || "APARTMENT",
      priceRangeMin: p.priceRangeMin ? String(p.priceRangeMin) : "",
      priceRangeMax: p.priceRangeMax ? String(p.priceRangeMax) : "",
      totalUnits: p.totalUnits ? String(p.totalUnits) : "",
      amenities: amenitiesStr,
      images: Array.isArray(p.images) ? p.images : [],
      videoUrl: p.videoUrl || "",
    });
    setModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      addToast("error", "Validation Error", "Project Name is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        developer: form.developer.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        city: form.city.trim(),
        country: form.country.trim(),
        status: form.status,
        propertyType: form.propertyType,
        priceRangeMin: form.priceRangeMin ? Number(form.priceRangeMin) : null,
        priceRangeMax: form.priceRangeMax ? Number(form.priceRangeMax) : null,
        totalUnits: form.totalUnits ? parseInt(form.totalUnits, 10) : 0,
        amenities: form.amenities,
        images: form.images.slice(0, 10),
        videoUrl: form.videoUrl.trim(),
      };

      if (editingProject) {
        const res = await fetch(`/api/projects/${editingProject.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update project");
        addToast("success", "Project Updated", `${form.name} updated successfully.`);
      } else {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create project");
        addToast("success", "Project Created", `${form.name} has been added.`);
      }

      setModalOpen(false);
      fetchProjects();
    } catch (err: any) {
      addToast("error", "Save Failed", err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async (p: ProjectItem) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${p.name}"?\n\nThis will remove the project and its unlinked buildings and units. This action cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(p.id);
    try {
      const res = await fetch(`/api/projects/${p.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete project");

      addToast("success", "Project Deleted", `"${p.name}" was successfully removed.`);
      fetchProjects();
    } catch (err: any) {
      addToast("error", "Delete Failed", err.message || "An error occurred while deleting project");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            Development Projects
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Master developments, launch schedules, tower configurations, and inventory allocation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/inventory"
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Boxes className="w-4 h-4 text-blue-600" />
            View Unit Matrix
          </Link>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading Development Projects...</div>
      ) : projects.length === 0 ? (
        <div className="py-20 text-center text-xs text-slate-400">
          No development projects found. Click &quot;New Project&quot; to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {projects.map((p) => {
            let amenitiesList: string[] = [];
            try {
              if (p.amenities) {
                const parsed = JSON.parse(p.amenities);
                amenitiesList = Array.isArray(parsed) ? parsed : [p.amenities];
              }
            } catch {
              if (p.amenities) amenitiesList = p.amenities.split(",").map((s) => s.trim());
            }

            return (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-blue-400 transition-all overflow-hidden flex flex-col group cursor-pointer relative"
                onClick={() => router.push(`/projects/${p.id}`)}
              >
                {/* Optional Media Hero Shot */}
                {p.images && p.images.length > 0 && (
                  <div className="relative h-40 w-full bg-slate-100 overflow-hidden border-b border-slate-100">
                    <Image
                      src={p.images[0]}
                      alt={p.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs flex items-center gap-1">
                        <Camera className="w-3 h-3 text-blue-400" />
                        {p.images.length} Photos
                      </span>
                      {p.videoUrl && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-600/90 text-white backdrop-blur-xs flex items-center gap-1">
                          <Film className="w-3 h-3" />
                          Video
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Header Card in Blue & White */}
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                      {p.code}
                    </span>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={p.status} />
                      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(p);
                          }}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit Project"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(p);
                          }}
                          disabled={deletingId === p.id}
                          className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          title="Delete Project"
                        >
                          {deletingId === p.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <h2 className="text-base font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                    {p.name}
                  </h2>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {p.location}, {p.city}
                  </p>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {p.description || "Master planned development featuring premium residential units."}
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-xs py-3 border-y border-slate-100">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">
                        Inventory Units
                      </span>
                      <span className="font-semibold text-slate-800">
                        {p._count?.units !== undefined ? p._count.units : p.totalUnits} Units
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">
                        Property Type
                      </span>
                      <span className="font-semibold text-slate-800 capitalize">
                        {p.propertyType?.toLowerCase() || "Apartment"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">
                        Pricing Starting
                      </span>
                      <span className="font-bold text-blue-600">
                        {p.priceRangeMin ? formatCurrency(p.priceRangeMin) : "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">
                        Towers
                      </span>
                      <span className="font-semibold text-slate-800">
                        {p.buildings?.length || 1} Building(s)
                      </span>
                    </div>
                  </div>

                  {/* Amenities pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {amenitiesList.slice(0, 3).map((a, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-[10px] text-slate-600 font-medium"
                      >
                        {a}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs font-semibold text-blue-600">
                    <span>Explore Master Project</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Project Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProject ? `Edit Project: ${editingProject.name}` : "Add New Development Project"}
        description={
          editingProject
            ? "Update project specifications, pricing tiers, and master property details."
            : "Register a new master development project in the real estate portfolio."
        }
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="project-form"
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {editingProject ? "Save Changes" : "Create Project"}
            </button>
          </div>
        }
      >
        <form id="project-form" onSubmit={handleSaveProject} className="space-y-4 py-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Marina Horizon Towers"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project Code (Unique Prefix)
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="e.g. MHT (auto-generated if empty)"
                className="w-full px-3 py-2 text-xs font-mono uppercase border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Developer</label>
              <input
                type="text"
                value={form.developer}
                onChange={(e) => setForm({ ...form, developer: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Property Type</label>
              <select
                value={form.propertyType}
                onChange={(e) => setForm({ ...form, propertyType: e.target.value })}
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                {PROJECT_STATUSES.map((ps) => (
                  <option key={ps.value} value={ps.value}>
                    {ps.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Location / Community</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Dubai Marina"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Country</label>
              <input
                type="text"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Starting Price (AED)</label>
              <input
                type="number"
                value={form.priceRangeMin}
                onChange={(e) => setForm({ ...form, priceRangeMin: e.target.value })}
                placeholder="e.g. 1500000"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Maximum Price (AED)</label>
              <input
                type="number"
                value={form.priceRangeMax}
                onChange={(e) => setForm({ ...form, priceRangeMax: e.target.value })}
                placeholder="e.g. 8500000"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Total Unit Capacity</label>
              <input
                type="number"
                value={form.totalUnits}
                onChange={(e) => setForm({ ...form, totalUnits: e.target.value })}
                placeholder="e.g. 48"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Amenities & Key Features (comma separated)
            </label>
            <input
              type="text"
              value={form.amenities}
              onChange={(e) => setForm({ ...form, amenities: e.target.value })}
              placeholder="Infinity Pool, Fitness Center, Smart Home Tech, 24/7 Security"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Media Uploader: Up to 10 Images & 1 Walkthrough Video */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Project Media Gallery (Limit: 10 Images & 1 Video)
            </label>
            <MediaUploader
              images={form.images}
              onImagesChange={(imgs) => setForm({ ...form, images: imgs })}
              videoUrl={form.videoUrl}
              onVideoChange={(v) => setForm({ ...form, videoUrl: v })}
              maxImages={10}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Master Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Highlight architecture, lifestyle amenities, transport links, and investment ROI."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 resize-none"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
