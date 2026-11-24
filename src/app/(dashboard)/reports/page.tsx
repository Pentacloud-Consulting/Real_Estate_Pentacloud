"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  Users,
  Building,
  FileSignature,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

export default function ReportsPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/dashboard")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="py-20 text-center text-xs text-[#64748B]">Loading Dynamic Analytics...</div>;
  }

  const exportReport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8,Metric,Value\n" +
      `Total Leads,${data?.kpis.totalLeads}\n` +
      `Qualified Leads,${data?.kpis.qualifiedLeads}\n` +
      `Active Opportunities,${data?.kpis.activeOpportunities}\n` +
      `Total EOI,${data?.kpis.totalEoi}\n` +
      `Units Reserved,${data?.kpis.unitsReserved}\n` +
      `Units Sold,${data?.kpis.unitsSold}\n` +
      `Total Sales Value,${data?.kpis.totalSalesValue}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `executive_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reporting & Executive Analytics"
        description="Comprehensive real estate intelligence computed from database transactions, inventory velocity, and conversion funnel"
        actions={
          <button
            onClick={exportReport}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#153B66] hover:bg-[#102C4C] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export KPI Summary
          </button>
        }
      />

      {/* Row 1: Key Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#64748B] block">Lead Conversion Funnel</span>
          <p className="text-2xl font-bold text-[#172033] mt-1">
            {data?.kpis.totalLeads > 0
              ? `${Math.round((data.kpis.qualifiedLeads / data.kpis.totalLeads) * 100)}%`
              : "0%"}
          </p>
          <p className="text-xs text-[#94A3B8] mt-1">Lead to Qualified Ratio</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#64748B] block">EOI to Reservation</span>
          <p className="text-2xl font-bold text-emerald-700 mt-1">
            {data?.kpis.totalEoi > 0
              ? `${Math.round((data.kpis.unitsReserved / data.kpis.totalEoi) * 100)}%`
              : "0%"}
          </p>
          <p className="text-xs text-[#94A3B8] mt-1">Token Lock Rate</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#64748B] block">Confirmed Revenue</span>
          <p className="text-2xl font-bold text-[#2563EB] mt-1">
            {formatCurrency(data?.kpis.totalSalesValue || 0)}
          </p>
          <p className="text-xs text-[#94A3B8] mt-1">Completed Sales & POs</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#64748B] block">KYC Verification Rate</span>
          <p className="text-2xl font-bold text-purple-700 mt-1">
            {data?.kpis.onboardingRate}%
          </p>
          <p className="text-xs text-[#94A3B8] mt-1">Handover Compliance</p>
        </div>
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
          <h2 className="text-sm font-bold text-[#172033] mb-4">Leads by Channel Attribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.leadsBySource || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} angle={-20} textAnchor="end" height={45} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
                <Tooltip />
                <Bar dataKey="value" fill="#153B66" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
          <h2 className="text-sm font-bold text-[#172033] mb-4">Project Inventory Velocity</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.inventoryStatus || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#64748B" }} />
                <YAxis dataKey="status" type="category" tick={{ fontSize: 11, fill: "#64748B" }} width={90} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563EB" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

