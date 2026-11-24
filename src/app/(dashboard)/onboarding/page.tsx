"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardCheck,
  ShieldCheck,
  Eye,
  AlertCircle,
  CheckCircle2,
  Clock,
  Briefcase,
  UserCheck,
  Globe,
} from "lucide-react";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";

interface OnboardingRecord {
  id: string;
  onboardingNumber: string;
  buyerCategory: string;
  status: string;
  completionPercentage: number;
  submissionDate: string | null;
  buyer: {
    id: string;
    accountNumber: string;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    buyerType: string;
    nationality: string | null;
  };
  checklistItems: any[];
}

export default function OnboardingListPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [records, setRecords] = useState<OnboardingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding");
      const data = await res.json();
      setRecords(data.records || []);
    } catch {
      addToast("error", "Error", "Failed to load onboarding workflows");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const columns: Column<OnboardingRecord>[] = [
    {
      key: "onboardingNumber",
      label: "Workflow ID",
      sortable: true,
      render: (item) => (
        <span className="font-mono text-xs font-bold text-[#2563EB]">
          {item.onboardingNumber}
        </span>
      ),
    },
    {
      key: "buyer",
      label: "Buyer / Entity",
      render: (item) => (
        <div>
          <button
            onClick={() => router.push(`/onboarding/${item.id}`)}
            className="text-left font-bold text-xs text-[#172033] hover:text-[#2563EB] transition-colors"
          >
            {item.buyer.companyName || `${item.buyer.firstName} ${item.buyer.lastName}`}
          </button>
          <p className="text-[10px] text-[#64748B] font-mono">{item.buyer.accountNumber}</p>
        </div>
      ),
    },
    {
      key: "buyerCategory",
      label: "AML / KYC Category",
      render: (item) => {
        let label = "Local Resident";
        let icon = UserCheck;
        if (item.buyerCategory === "CORPORATE") {
          label = "Corporate / Institutional";
          icon = Briefcase;
        } else if (item.buyerCategory === "INDIVIDUAL_INTERNATIONAL") {
          label = "International Non-Resident";
          icon = Globe;
        }
        const Icon = icon;

        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EFF6FF] text-[#153B66] border border-[#BFDBFE]">
            <Icon className="w-3.5 h-3.5 text-[#2563EB]" />
            {label}
          </span>
        );
      },
    },
    {
      key: "progress",
      label: "Verification Completion",
      render: (item) => (
        <div className="w-40 space-y-1">
          <div className="flex justify-between text-[11px] font-semibold">
            <span className="text-[#172033]">{item.completionPercentage}%</span>
            <span className="text-[#64748B]">
              {item.checklistItems.filter((c) => c.status === "VERIFIED").length} / {item.checklistItems.length}
            </span>
          </div>
          <div className="w-full bg-[#E2E8F0] rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                item.completionPercentage === 100 ? "bg-emerald-600" : "bg-[#2563EB]"
              }`}
              style={{ width: `${item.completionPercentage}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Workflow Status",
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "submissionDate",
      label: "Initiated",
      render: (item) => (
        <span className="text-xs text-[#64748B]">
          {item.submissionDate ? formatDate(item.submissionDate) : "-"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Buyer Onboarding & KYC Compliance"
        description="Dynamic onboarding verification workspaces tailored for Local Residents, International Buyers, and Corporate Purchasers"
      />

      <DataTable
        data={records}
        columns={columns}
        loading={loading}
        emptyMessage="No active onboarding workflows."
        actions={(item) => (
          <button
            onClick={() => router.push(`/onboarding/${item.id}`)}
            className="flex items-center gap-1 px-3 py-1 bg-[#153B66] hover:bg-[#102C4C] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-200" />
            Reviewer Workspace
          </button>
        )}
      />
    </div>
  );
}

