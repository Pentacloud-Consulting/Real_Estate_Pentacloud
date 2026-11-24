"use client";

import { useEffect, useState } from "react";
import {
  Activity as ActivityIcon,
  Clock,
  Phone,
  Mail,
  MessageCircle,
  Calendar,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Building,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";

export default function ActivitiesPage() {
  const { addToast } = useToast();
  const [activities, setActivities] = useState<any[]>([]);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"timeline" | "followups">("timeline");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/activities");
      const data = await res.json();
      setActivities(data.activities || []);
      setFollowUps(data.followUps || []);
    } catch {
      addToast("error", "Error", "Failed to load activity stream");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Activity Log & Scheduled Follow-ups"
        description="Comprehensive audit timeline of communications, sales calls, unit reservations, payments, and compliance milestones"
      />

      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2">
        <button
          onClick={() => setActiveTab("timeline")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === "timeline" ? "bg-[#153B66] text-white" : "text-[#64748B] hover:bg-[#F8FAFC]"
          }`}
        >
          Activity Stream ({activities.length})
        </button>
        <button
          onClick={() => setActiveTab("followups")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === "followups" ? "bg-[#153B66] text-white" : "text-[#64748B] hover:bg-[#F8FAFC]"
          }`}
        >
          Follow-up Reminders ({followUps.length})
        </button>
      </div>

      {activeTab === "timeline" ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs space-y-3">
          {activities.map((a) => (
            <div
              key={a.id}
              className="flex items-start gap-3.5 p-3.5 rounded-xl border border-[#F1F5F9] bg-[#F8FAFC]/50 hover:bg-[#F8FAFC] transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-[#2563EB]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-[#172033]">{a.subject}</p>
                  <span className="text-[10px] text-[#94A3B8]">{formatDate(a.createdAt)}</span>
                </div>
                {a.description && (
                  <p className="text-xs text-[#64748B] mt-0.5">{a.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[#94A3B8]">
                  <span>By {a.createdBy.firstName} {a.createdBy.lastName}</span>
                  {a.lead && <span>Lead: {a.lead.firstName} {a.lead.lastName}</span>}
                  {a.buyer && <span>Buyer: {a.buyer.companyName || `${a.buyer.firstName} ${a.buyer.lastName}`}</span>}
                  {a.unit && <span>Unit: {a.unit.unitNumber}</span>}
                </div>
              </div>
            </div>
          ))}
          {activities.length === 0 && (
            <p className="py-12 text-center text-xs text-[#94A3B8]">No activities logged.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {followUps.map((f) => (
            <div
              key={f.id}
              className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs space-y-2 hover:border-[#BFDBFE] transition-colors"
            >
              <div className="flex items-start justify-between">
                <p className="text-xs font-bold text-[#172033]">{f.title}</p>
                <StatusBadge status={f.status} />
              </div>
              {f.description && (
                <p className="text-xs text-[#64748B]">{f.description}</p>
              )}
              <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[11px]">
                <span className="text-[#94A3B8]">
                  Client: <strong className="text-[#172033]">{f.lead ? `${f.lead.firstName} ${f.lead.lastName}` : f.buyer ? (f.buyer.companyName || `${f.buyer.firstName} ${f.buyer.lastName}`) : "-"}</strong>
                </span>
                <span className="font-semibold text-rose-600">
                  Due: {formatDate(f.dueDate)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

