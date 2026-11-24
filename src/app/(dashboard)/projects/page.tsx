"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  Plus,
  Boxes,
  Compass,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/lib/utils";

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        setProjects(data.projects || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Boxes className="w-4 h-4" />
            View Unit Matrix
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading Development Projects...</div>
      ) : projects.length === 0 ? (
        <div className="py-20 text-center text-xs text-slate-400">No development projects found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {projects.map((p) => {
            let amenitiesList: string[] = [];
            try {
              if (p.amenities) amenitiesList = JSON.parse(p.amenities);
            } catch {}

            return (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-blue-400 transition-all overflow-hidden flex flex-col group cursor-pointer"
                onClick={() => router.push(`/projects/${p.id}`)}
              >
                {/* Header Card in Blue & White */}
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                      {p.code}
                    </span>
                    <StatusBadge status={p.status} />
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
                    {p.description || "Master planned waterfront development featuring premium residential units."}
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-xs py-3 border-y border-slate-100">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">
                        Inventory Units
                      </span>
                      <span className="font-semibold text-slate-800">
                        {p._count?.units || p.totalUnits} Units
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
    </div>
  );
}
