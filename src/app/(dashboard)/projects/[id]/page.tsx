"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Layers,
  Boxes,
  DollarSign,
  TrendingUp,
  FileText,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/lib/utils";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  const [project, setProject] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((res) => res.json())
      .then((data) => {
        setProject(data.project);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return <div className="py-20 text-center text-xs text-[#64748B]">Loading project master details...</div>;
  }

  if (!project) {
    return <div className="py-20 text-center text-xs text-rose-600">Project not found.</div>;
  }

  let amenitiesList: string[] = [];
  try {
    if (project.amenities) amenitiesList = JSON.parse(project.amenities);
  } catch {}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/projects")}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#172033] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </button>
        <button
          onClick={() => router.push(`/inventory?projectId=${project.id}`)}
          className="px-3.5 py-1.5 bg-[#153B66] hover:bg-[#102C4C] text-white text-xs font-semibold rounded-lg shadow-xs"
        >
          View Units in Inventory
        </button>
      </div>

      {/* Hero Header */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-[#172033]">{project.name}</h1>
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] rounded">
                {project.code}
              </span>
              <StatusBadge status={project.status} />
            </div>
            <p className="text-xs text-[#64748B] mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#3B82F6]" />
              {project.address}, {project.location}, {project.city}, {project.country}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-xs">
              <span className="text-[#94A3B8] block text-[10px] uppercase font-bold">Price Range</span>
              <span className="font-bold text-emerald-700">
                {formatCurrency(project.priceRangeMin)} – {formatCurrency(project.priceRangeMax)}
              </span>
            </div>
            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-xs">
              <span className="text-[#94A3B8] block text-[10px] uppercase font-bold">Total Units</span>
              <span className="font-bold text-[#172033]">{project.units?.length || project.totalUnits} Units</span>
            </div>
          </div>
        </div>
      </div>

      {/* Buildings & Tower breakdown */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#172033]">Tower & Building Configurations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(project.buildings || []).map((b: any) => (
            <div key={b.id} className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#172033]">{b.name}</span>
                <span className="text-[10px] font-semibold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded">
                  {b.totalFloors} Floors
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-2">
                Total Capacity: <strong>{b.units?.length || b.totalUnits}</strong> Units
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Project Amenities */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-[#172033]">Amenities & Development Features</h2>
        <div className="flex flex-wrap gap-2">
          {amenitiesList.map((a, i) => (
            <span
              key={i}
              className="px-3 py-1 bg-[#EFF6FF] text-[#153B66] border border-[#BFDBFE] rounded-lg text-xs font-semibold"
            >
              ✓ {a}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

