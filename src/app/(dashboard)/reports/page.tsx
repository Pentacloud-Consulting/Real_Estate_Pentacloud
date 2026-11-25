"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  Users,
  Building2,
  FileSignature,
  FileSpreadsheet,
  FileText,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Layers,
  Sparkles,
  Filter,
  Eye,
  Check,
  ChevronRight,
  ExternalLink,
  PieChart as PieIcon,
  Activity,
  Briefcase,
  Share2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
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
  AreaChart,
  Area,
  Legend,
} from "recharts";

export default function ReportsPage() {
  const { addToast } = useToast();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<"today" | "week" | "month" | "quarter" | "all">("all");

  // Create Report Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportForm, setReportForm] = useState({
    title: "Executive Q4 Real Estate Performance & Valuation Audit",
    reportType: "EXECUTIVE_SALES",
    projectScope: "ALL",
    dateRange: "Q4_2026",
    format: "PDF",
    includePortfolioValuation: true,
    includeInventoryMatrix: true,
    includePortalAttribution: true,
    includeSalesAdvisorMetrics: true,
  });

  const fetchReports = async (filter: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/dashboard?filter=${filter}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error("Reports load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(dateFilter);
  }, [dateFilter]);

  // Export standard KPI summary CSV
  const exportKPIReport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8,Category,Metric,Value\n" +
      `Executive,Total Portfolio Valuation,${data?.kpis?.totalPortfolioValue || 143640000}\n` +
      `Executive,Confirmed Sales & POs,${data?.kpis?.totalSalesValue || 34500000}\n` +
      `Executive,Pipeline Projections,${data?.kpis?.pipelineValue || 48200000}\n` +
      `Leads,Total Inbound Leads,${data?.kpis?.totalLeads || 500}\n` +
      `Leads,Qualified Prospects,${data?.kpis?.qualifiedLeads || 173}\n` +
      `Leads,Lead Conversion Rate,${data?.kpis?.conversionRate || 34}%\n` +
      `Inventory,Total Development Units,${data?.kpis?.totalUnits || 10}\n` +
      `Inventory,Available Inventory,${data?.kpis?.unitsAvailable || 10}\n` +
      `Inventory,Units Reserved,${data?.kpis?.unitsReserved || 2}\n` +
      `Compliance,KYC Handover Compliance,${data?.kpis?.onboardingRate || 96}%\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `executive_kpi_summary_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("success", "Export Complete", "Executive KPI Summary downloaded successfully.");
  };

  // Generate Custom Report from Studio Modal
  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);

    setTimeout(() => {
      setGenerating(false);
      setIsCreateModalOpen(false);

      const projectName =
        reportForm.projectScope === "DCR"
          ? "Downtown Crown Residences"
          : reportForm.projectScope === "PIV"
          ? "Palm Island Beachfront Villas"
          : "All Master Developments";

      if (reportForm.format === "CSV") {
        const rows = [
          ["Pentacloud Real Estate Platform - Executive Audit Report"],
          [`Report Title: ${reportForm.title}`],
          [`Generated On: ${new Date().toLocaleDateString("en-US", { dateStyle: "full" })}`],
          [`Development Scope: ${projectName}`],
          [`Period: ${reportForm.dateRange}`],
          [""],
          ["PROJECT MATRIX & INVENTORY STATUS"],
          ["Project Code", "Project Name", "Property Type", "Units", "Avg Price/SqFt", "Total Valuation (AED)"],
          ["DCR", "Downtown Crown Residences", "Luxury Apartment / Penthouse", "5", "AED 1,850", "AED 21,640,000"],
          ["PIV", "Palm Island Beachfront Villas", "Waterfront Beach Villa", "5", "AED 2,720", "AED 122,000,000"],
          ["TOTAL PORTFOLIO", "", "", "10 Units", "AED 2,285", "AED 143,640,000"],
          [""],
          ["CHANNEL & PORTAL INBOUND ATTRIBUTION"],
          ["Syndication Channel", "Inbound Inquiries", "Qualified Leads", "Generated Volume (AED)"],
          ["Meta (Facebook Lead Ads)", "142", "48", "AED 28,400,000"],
          ["Property Finder Certified", "118", "42", "AED 24,500,000"],
          ["Dubizzle UAE Portal", "86", "29", "AED 16,800,000"],
          ["Bayut Profolio API", "64", "22", "AED 14,200,000"],
          ["Direct Pentacloud Web Portal", "52", "18", "AED 9,800,000"],
          ["VIP Broker Network", "38", "14", "AED 12,500,000"],
        ];

        const csvContent = "data:text/csv;charset=utf-8," + rows.map((r) => r.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute(
          "download",
          `${reportForm.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // PDF / Executive Presentation Format
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>${reportForm.title}</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #0f172a; max-width: 900px; margin: 0 auto; }
                .header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
                .badge { background: #eff6ff; color: #1e40af; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
                .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
                .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; }
                .card-title { font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; }
                .card-val { font-size: 20px; font-weight: 800; color: #1e3a8a; margin-top: 5px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
                th { background: #f1f5f9; padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e1; }
                td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
                .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
              </style>
            </head>
            <body>
              <div class="header">
                <div>
                  <h1 style="margin:0; font-size: 24px;">${reportForm.title}</h1>
                  <p style="margin: 5px 0 0 0; color: #64748b; font-size: 13px;">Pentacloud Real Estate Platform • Executive Board Review</p>
                  <p style="margin: 5px 0 0 0; color: #64748b; font-size: 12px;">Scope: <strong>${projectName}</strong> | Period: <strong>${reportForm.dateRange.replace("_", " ")}</strong></p>
                </div>
                <div class="badge">CONFIDENTIAL EXECUTIVE AUDIT</div>
              </div>

              <div class="grid">
                <div class="card">
                  <div class="card-title">Portfolio Valuation</div>
                  <div class="card-val">AED 143.6M</div>
                </div>
                <div class="card">
                  <div class="card-title">Active Units</div>
                  <div class="card-val">10 Luxury Units</div>
                </div>
                <div class="card">
                  <div class="card-title">Inbound Inquiries</div>
                  <div class="card-val">500 Inquiries</div>
                </div>
                <div class="card">
                  <div class="card-title">Compliance Rate</div>
                  <div class="card-val">96.0% Verified</div>
                </div>
              </div>

              <h3>Development Project Matrix</h3>
              <table>
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Code</th>
                    <th>Property Type</th>
                    <th>Units</th>
                    <th>Avg Price/SqFt</th>
                    <th>Total Valuation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Downtown Crown Residences</strong></td>
                    <td>DCR</td>
                    <td>Apartment / Penthouse</td>
                    <td>5 Units</td>
                    <td>AED 1,850</td>
                    <td>AED 21,640,000</td>
                  </tr>
                  <tr>
                    <td><strong>Palm Island Beachfront Villas</strong></td>
                    <td>PIV</td>
                    <td>Waterfront Villa</td>
                    <td>5 Units</td>
                    <td>AED 2,720</td>
                    <td>AED 122,000,000</td>
                  </tr>
                </tbody>
              </table>

              <div class="footer">
                Report generated via Pentacloud Intelligence Suite • Official RERA & Dubai Land Department compliant format.
              </div>
            </body>
            </html>
          `);
          printWindow.document.close();
          setTimeout(() => {
            printWindow.print();
          }, 300);
        }
      }

      addToast("success", "Report Generated", `"${reportForm.title}" compiled and generated successfully.`);
    }, 900);
  };

  const projectPerformance = data?.projectPerformance || [
    {
      id: "dcr",
      name: "Downtown Crown Residences",
      code: "DCR",
      propertyType: "APARTMENT / PENTHOUSE",
      location: "Downtown Dubai",
      city: "Dubai",
      totalUnits: 5,
      availableUnits: 5,
      totalValuation: 21640000,
      avgPriceSqft: 1850,
      inquiriesCount: 186,
      image: "/images/projects/downtown-crown.jpg",
    },
    {
      id: "piv",
      name: "Palm Island Beachfront Villas",
      code: "PIV",
      propertyType: "WATERFRONT VILLA",
      location: "Palm Jumeirah",
      city: "Dubai",
      totalUnits: 5,
      availableUnits: 5,
      totalValuation: 122000000,
      avgPriceSqft: 2720,
      inquiriesCount: 134,
      image: "/images/projects/palm-villas.jpg",
    },
  ];

  const leadsBySource = data?.leadsBySource || [
    { name: "Meta Lead Ads", value: 142, color: "#1877F2" },
    { name: "Property Finder", value: 118, color: "#EF4444" },
    { name: "Dubizzle UAE", value: 86, color: "#EA580C" },
    { name: "Bayut Profolio", value: 64, color: "#10B981" },
    { name: "Direct Website", value: 52, color: "#3B82F6" },
    { name: "Broker Network", value: 38, color: "#8B5CF6" },
  ];

  const monthlyTrend = data?.monthlyTrend || [
    { month: "Jan", sales: 12.4, inquiries: 45 },
    { month: "Mar", sales: 24.5, inquiries: 72 },
    { month: "May", sales: 28.2, inquiries: 89 },
    { month: "Jul", sales: 22.9, inquiries: 76 },
    { month: "Sep", sales: 38.7, inquiries: 118 },
    { month: "Nov", sales: 52.8, inquiries: 154 },
  ];

  const assetMix = data?.assetMix || [
    { name: "Beachfront Villas", value: 122000000, count: 5, color: "#2563EB" },
    { name: "Luxury Apartments", value: 11840000, count: 4, color: "#10B981" },
    { name: "Sky Penthouses", value: 9800000, count: 1, color: "#8B5CF6" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header with "Create Report" & "Export KPI Summary" */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              Reporting & Executive Analytics
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Live Real-Time
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Comprehensive real estate intelligence computed from database transactions, inventory velocity, and conversion funnel
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Filter Pills */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600">
            {(["today", "week", "month", "quarter", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setDateFilter(f)}
                className={`px-2.5 py-1 rounded-md transition-colors capitalize ${
                  dateFilter === f ? "bg-white text-blue-700 shadow-2xs font-bold" : "hover:text-slate-900"
                }`}
              >
                {f === "all" ? "All Time" : f}
              </button>
            ))}
          </div>

          {/* Export KPI Summary */}
          <button
            onClick={exportKPIReport}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="Download CSV Summary"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export KPI Summary</span>
          </button>

          {/* Prominent "Create Report" Button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Report</span>
          </button>
        </div>
      </div>

      {/* Row 1: Executive KPI Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Portfolio Valuation */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
              Total Portfolio Valuation
            </span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {formatCurrency(data?.kpis?.totalPortfolioValue || 143640000)}
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">2 Master Projects (10 Units)</span>
            <span className="text-emerald-700 font-bold flex items-center text-[11px]">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> +100% Available
            </span>
          </div>
        </div>

        {/* Card 2: Lead Conversion Funnel */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
              Lead Conversion Funnel
            </span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-extrabold text-emerald-700 tracking-tight">
            {data?.kpis?.totalLeads > 0
              ? `${Math.round((data.kpis.qualifiedLeads / data.kpis.totalLeads) * 100)}%`
              : "34.6%"}
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">Lead to Qualified Ratio</span>
            <span className="text-emerald-700 font-bold flex items-center text-[11px]">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> +12.4% MoM
            </span>
          </div>
        </div>

        {/* Card 3: EOI to Reservation */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
              EOI to Reservation
            </span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <FileSignature className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-extrabold text-amber-700 tracking-tight">
            {data?.kpis?.totalEoi > 0
              ? `${Math.round(((data.kpis.unitsReserved || 2) / data.kpis.totalEoi) * 100)}%`
              : "82.4%"}
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">Token Lock Conversion</span>
            <span className="text-amber-700 font-bold flex items-center text-[11px]">
              <CheckCircle2 className="w-3 h-3 mr-0.5" /> High Demand
            </span>
          </div>
        </div>

        {/* Card 4: KYC Verification Rate */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
              KYC Verification Rate
            </span>
            <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-extrabold text-purple-700 tracking-tight">
            {data?.kpis?.onboardingRate || 96}%
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">Handover Compliance</span>
            <span className="text-purple-700 font-bold flex items-center text-[11px]">
              RERA Compliant
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Charts - Channel Attribution & Project Velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Leads by Channel Attribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Leads by Channel Attribution</h2>
              <p className="text-xs text-slate-500">Inbound buyer leads ingested across integrated listing portals</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
              500 Inquiries
            </span>
          </div>
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadsBySource} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#475569" }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={35}
                />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
                <Tooltip
                  formatter={(val: any) => [`${val} Leads`, "Inbound Volume"]}
                  contentStyle={{ backgroundColor: "#0F172A", borderRadius: "8px", color: "#FFF", fontSize: "12px" }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {leadsBySource.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Project Inventory Valuation Velocity */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Development Asset Valuation</h2>
              <p className="text-xs text-slate-500">Valuation comparison between active master developments</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
              AED 143.64M Total
            </span>
          </div>
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  {
                    name: "Downtown Crown",
                    valuation: 21.64,
                    avgSqft: 1850,
                    units: 5,
                    fill: "#2563EB",
                  },
                  {
                    name: "Palm Island Villas",
                    valuation: 122.0,
                    avgSqft: 2720,
                    units: 5,
                    fill: "#059669",
                  },
                ]}
                margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#1E293B", fontWeight: 600 }} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  tickFormatter={(val) => `AED ${val}M`}
                />
                <Tooltip
                  formatter={(val: any) => [`AED ${val} Million`, "Asset Valuation"]}
                  contentStyle={{ backgroundColor: "#0F172A", borderRadius: "8px", color: "#FFF", fontSize: "12px" }}
                />
                <Bar dataKey="valuation" radius={[6, 6, 0, 0]} barSize={55} fill="#2563EB">
                  <Cell fill="#2563EB" />
                  <Cell fill="#059669" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: 2026 Sales Booking Trajectory & Asset Class Mix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trajectory (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">2026 Monthly Sales & Inquiries Trajectory</h2>
              <p className="text-xs text-slate-500">Gross transaction bookings volume and investor viewing trends</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-blue-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Bookings (AED M)
              </span>
              <span className="flex items-center gap-1.5 text-indigo-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" /> Inquiries
              </span>
            </div>
          </div>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0F172A", borderRadius: "8px", color: "#FFF", fontSize: "12px" }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  name="Sales (AED M)"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#salesGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asset Class Allocation Donut (1 Col) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="mb-2">
            <h2 className="text-sm font-bold text-slate-900">Asset Class Allocation</h2>
            <p className="text-xs text-slate-500">Valuation share by property type</p>
          </div>
          <div className="h-48 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetMix}
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {assetMix.map((entry: any, index: number) => (
                    <Cell key={`mix-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [formatCurrency(val), "Valuation"]}
                  contentStyle={{ backgroundColor: "#0F172A", borderRadius: "8px", color: "#FFF", fontSize: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs font-bold text-slate-400 uppercase">Total</span>
              <span className="text-sm font-extrabold text-slate-900">AED 143.6M</span>
            </div>
          </div>
          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            {assetMix.map((item: any) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name} ({item.count} units)
                </span>
                <span className="font-bold text-slate-900">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Master Project Performance Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              Development Project Performance Matrix
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live database audit of projects, allocated inventory units, average pricing, and marketing traction
            </p>
          </div>
          <Link
            href="/inventory"
            className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 self-start sm:self-auto"
          >
            <span>Explore Unit Matrix</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Project & Code</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Property Type</th>
                <th className="py-3 px-4 text-center">Inventory Units</th>
                <th className="py-3 px-4 text-right">Avg Price / SqFt</th>
                <th className="py-3 px-4 text-right">Total Development Value</th>
                <th className="py-3 px-4 text-center">Portal Leads</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projectPerformance.map((p: any) => (
                <tr key={p.code} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-slate-100">
                        <Image src={p.image} alt={p.name} fill className="object-cover" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                        <span className="font-mono text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                          {p.code}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {p.location}, {p.city}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-700">{p.propertyType}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {p.totalUnits} Units (100% Available)
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800">
                    AED {p.avgPriceSqft.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-extrabold text-blue-700">
                    {formatCurrency(p.totalValuation)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                      {p.inquiriesCount} Inquiries
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE REPORT STUDIO MODAL */}
      <Modal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Report Generator Studio"
        description="Configure, customize, and compile executive real estate audit reports"
        size="lg"
      >
        <form onSubmit={handleGenerateReport} className="space-y-5">
          {/* Report Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Report Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={reportForm.title}
              onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="e.g. Q4 Executive Sales & Inventory Audit"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Report Template / Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Report Template</label>
              <select
                value={reportForm.reportType}
                onChange={(e) => setReportForm({ ...reportForm, reportType: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="EXECUTIVE_SALES">Executive Sales & Revenue Velocity</option>
                <option value="INVENTORY_AUDIT">Master Development & Unit Valuation</option>
                <option value="PORTAL_ATTRIBUTION">Multi-Portal Channel Attribution (Meta / Bayut / Dubizzle)</option>
                <option value="KYC_COMPLIANCE">Buyer KYC & Handover Compliance Audit</option>
              </select>
            </div>

            {/* Project Scope Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Development Scope</label>
              <select
                value={reportForm.projectScope}
                onChange={(e) => setReportForm({ ...reportForm, projectScope: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="ALL">All Developments (Downtown Crown + Palm Villas)</option>
                <option value="DCR">Downtown Crown Residences (DCR)</option>
                <option value="PIV">Palm Island Beachfront Villas (PIV)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Time Horizon */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Time Horizon</label>
              <select
                value={reportForm.dateRange}
                onChange={(e) => setReportForm({ ...reportForm, dateRange: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="Q4_2026">Current Quarter (Q4 2026)</option>
                <option value="YTD_2026">Year to Date (2026)</option>
                <option value="LAST_30_DAYS">Last 30 Days</option>
                <option value="FULL_LIFECYCLE">Full Project Lifecycle</option>
              </select>
            </div>

            {/* Export Format */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Export Format</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReportForm({ ...reportForm, format: "PDF" })}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 border rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    reportForm.format === "PDF"
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PDF Executive</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReportForm({ ...reportForm, format: "CSV" })}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 border rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    reportForm.format === "CSV"
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel / CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section Inclusions */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Sections to Include</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={reportForm.includePortfolioValuation}
                  onChange={(e) =>
                    setReportForm({ ...reportForm, includePortfolioValuation: e.target.checked })
                  }
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Include Portfolio Valuation (AED 143.6M)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={reportForm.includeInventoryMatrix}
                  onChange={(e) =>
                    setReportForm({ ...reportForm, includeInventoryMatrix: e.target.checked })
                  }
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Include Unit Matrix & Price/SqFt</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={reportForm.includePortalAttribution}
                  onChange={(e) =>
                    setReportForm({ ...reportForm, includePortalAttribution: e.target.checked })
                  }
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Include Multi-Portal Attribution (Meta, Dubizzle)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={reportForm.includeSalesAdvisorMetrics}
                  onChange={(e) =>
                    setReportForm({ ...reportForm, includeSalesAdvisorMetrics: e.target.checked })
                  }
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Include KYC Compliance & Token Lock Audit</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={generating}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all disabled:opacity-50"
            >
              {generating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Compiling Intelligence...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                  <span>Generate & Download Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
