"use client";

import { useEffect, useState } from "react";
import {
  FolderLock,
  FileText,
  Search,
  Download,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
} from "lucide-react";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";

interface VaultDoc {
  id: string;
  fileName: string;
  originalName: string;
  category: string;
  mimeType: string;
  fileSize: number;
  status: string;
  uploadedAt: string;
  buyer: { firstName: string; lastName: string; companyName: string; accountNumber: string } | null;
  checklistItem: { documentName: string } | null;
  verifications: { action: string; notes: string; verifiedBy: { firstName: string; lastName: string } }[];
}

export default function DocumentVaultPage() {
  const { addToast } = useToast();
  const [documents, setDocuments] = useState<VaultDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch {
      addToast("error", "Error", "Failed to load document vault");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const filteredDocs = categoryFilter
    ? documents.filter((d) => d.category === categoryFilter)
    : documents;

  const columns: Column<VaultDoc>[] = [
    {
      key: "originalName",
      label: "Document File",
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2.5">
          <FileText className="w-4 h-4 text-[#2563EB] shrink-0" />
          <div>
            <p className="font-semibold text-xs text-[#172033]">{item.originalName}</p>
            <p className="text-[10px] text-[#64748B]">{item.checklistItem?.documentName || item.fileName}</p>
          </div>
        </div>
      ),
    },
    {
      key: "buyer",
      label: "Associated Buyer",
      render: (item) => (
        <div>
          <p className="font-medium text-xs text-[#172033]">
            {item.buyer ? item.buyer.companyName || `${item.buyer.firstName} ${item.buyer.lastName}` : "-"}
          </p>
          <span className="text-[10px] text-[#64748B] font-mono">{item.buyer?.accountNumber}</span>
        </div>
      ),
    },
    {
      key: "category",
      label: "Vault Category",
      render: (item) => (
        <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded">
          {item.category}
        </span>
      ),
    },
    {
      key: "status",
      label: "Compliance Status",
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "verification",
      label: "Review Audit",
      render: (item) => {
        const v = item.verifications?.[0];
        if (!v) return <span className="text-[11px] text-[#94A3B8]">Unreviewed</span>;
        return (
          <div className="text-xs">
            <span className="font-semibold text-[#172033] block">{v.action}</span>
            <span className="text-[10px] text-[#64748B]">
              By {v.verifiedBy.firstName} {v.verifiedBy.lastName}
            </span>
          </div>
        );
      },
    },
    {
      key: "uploadedAt",
      label: "Uploaded",
      render: (item) => (
        <span className="text-xs text-[#64748B]">{formatDate(item.uploadedAt)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Enterprise Document Vault"
        description="Secure, centralized repository for identity passports, trade licenses, wire receipts, and signed property contracts"
      />

      <div className="flex items-center gap-2.5 p-3.5 bg-white border border-[#E2E8F0] rounded-xl shadow-xs">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-xs font-medium border border-[#E2E8F0] rounded-lg px-3 py-1.5 bg-[#F8FAFC] text-[#172033]"
        >
          <option value="">All Categories</option>
          <option value="KYC">KYC & Identity</option>
          <option value="PAYMENT">Payment Receipts & Swift</option>
          <option value="EOI">EOI Documents</option>
          <option value="CONTRACT">Contracts & SPA</option>
        </select>
      </div>

      <DataTable
        data={filteredDocs}
        columns={columns}
        loading={loading}
        emptyMessage="No documents found in vault."
      />
    </div>
  );
}

