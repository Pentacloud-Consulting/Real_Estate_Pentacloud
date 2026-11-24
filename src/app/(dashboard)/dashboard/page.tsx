"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Building2,
  TrendingUp,
  Activity,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  DollarSign,
  UserCheck,
  Calendar,
  AlertCircle,
  Briefcase,
  Layers,
  ChevronRight,
  Plus,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface DashboardData {
  kpis: {
    totalLeads: number;
    newLeads: number;
    qualifiedLeads: number;
    convertedLeads: number;
    totalContacts: number;
    totalAccounts: number;
    openOpportunities: number;
    wonOpportunities: number;
    lostOpportunities: number;
    pipelineValue: number;
    conversionRate: number;
  };
  leadsByStatus: { status: string; count: number }[];
  oppsByStage: { stage: string; count: number }[];
  recentLeads: {
    id: string;
    leadNumber: string;
    name: string;
    company: string;
    status: string;
    rating: string;
    advisor: string;
    createdAt: string;
  }[];
  recentAccounts: {
    id: string;
    accountNumber: string;
    name: string;
    industry: string;
    contactsCount: number;
    oppsCount: number;
    createdAt: string;
  }[];
  recentActivities: {
    id: string;
    type: string;
    subject: string;
    description?: string;
    relatedName: string;
    createdBy: string;
    createdAt: string;
  }[];
  tasksDueToday: {
    id: string;
    title: string;
    dueDate: string;
    assignedTo: string;
    client: string;
    priority: string;
    status: string;
  }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<"today" | "week" | "month" | "quarter" | "all">("all");

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/dashboard?filter=${dateFilter}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (e) {
      console.error("Dashboard error:", e);
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const kpis = data?.kpis || {
    totalLeads: 0,
    newLeads: 0,
    qualifiedLeads: 0,
    convertedLeads: 0,
    totalContacts: 0,
    totalAccounts: 0,
    openOpportunities: 0,
    wonOpportunities: 0,
    lostOpportunities: 0,
    pipelineValue: 0,
    conversionRate: 0,
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Top Header & Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            CRM Sales Overview
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time pipeline metrics, conversion performance, and customer accounts
          </p>
        </div>

        {/* Date Filter Buttons */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
          {[
            { id: "today", label: "Today" },
            { id: "week", label: "This Week" },
            { id: "month", label: "This Month" },
            { id: "quarter", label: "This Quarter" },
            { id: "all", label: "All Time" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDateFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                dateFilter === tab.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 11 Salesforce KPI Cards in Clean Minimal Blue & White */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Leads */}
        <Link href="/leads" className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-400 transition-all block">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Leads</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{kpis.totalLeads}</span>
          <span className="text-[10px] text-blue-600 font-semibold mt-1 flex items-center gap-0.5">
            {kpis.newLeads} New Prospects
          </span>
        </Link>

        {/* Qualified Leads */}
        <Link href="/leads?view=qualified" className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-400 transition-all block">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Qualified Leads</span>
          <span className="text-2xl font-bold text-blue-600 mt-1 block">{kpis.qualifiedLeads}</span>
          <span className="text-[10px] text-slate-500 font-medium mt-1 block">Ready for conversion</span>
        </Link>

        {/* Converted Leads */}
        <Link href="/leads?view=converted" className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-400 transition-all block">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Converted Leads</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{kpis.convertedLeads}</span>
          <span className="text-[10px] text-blue-600 font-semibold mt-1 block">{kpis.conversionRate}% Conversion Rate</span>
        </Link>

        {/* Total Contacts */}
        <Link href="/contacts" className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-400 transition-all block">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Contacts</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{kpis.totalContacts}</span>
          <span className="text-[10px] text-slate-500 font-medium mt-1 block">Active individuals</span>
        </Link>

        {/* Total Accounts */}
        <Link href="/accounts" className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-400 transition-all block">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Accounts</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{kpis.totalAccounts}</span>
          <span className="text-[10px] text-slate-500 font-medium mt-1 block">Customer companies</span>
        </Link>

        {/* Pipeline Value */}
        <Link href="/opportunities" className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/20 shadow-xs hover:border-blue-500 transition-all block col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">Pipeline Value</span>
          <span className="text-xl font-bold text-blue-700 mt-1 block truncate">
            {formatCurrency(kpis.pipelineValue)}
          </span>
          <span className="text-[10px] text-blue-600 font-semibold mt-1 block">
            {kpis.openOpportunities} Open Deals
          </span>
        </Link>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Open Opportunities</span>
            <span className="text-xl font-bold text-slate-900 block mt-0.5">{kpis.openOpportunities}</span>
          </div>
          <TrendingUp className="w-5 h-5 text-blue-600" />
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Deals Won</span>
            <span className="text-xl font-bold text-blue-600 block mt-0.5">{kpis.wonOpportunities}</span>
          </div>
          <CheckCircle2 className="w-5 h-5 text-blue-600" />
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Deals Lost</span>
            <span className="text-xl font-bold text-slate-500 block mt-0.5">{kpis.lostOpportunities}</span>
          </div>
          <AlertCircle className="w-5 h-5 text-slate-400" />
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lead Conversion Rate</span>
            <span className="text-xl font-bold text-slate-900 block mt-0.5">{kpis.conversionRate}%</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center border border-blue-200">
            %
          </div>
        </div>
      </div>

      {/* Main Grid: Pipeline Breakdown & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Pipeline Stages */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Opportunities by Stage
            </h3>
            <Link href="/opportunities" className="text-xs font-semibold text-blue-600 hover:underline">
              View All Deals
            </Link>
          </div>

          <div className="space-y-3">
            {(!data?.oppsByStage || data.oppsByStage.length === 0) ? (
              <p className="text-xs text-slate-400 py-6 text-center">No opportunities recorded in this period.</p>
            ) : (
              data.oppsByStage.map((s) => {
                const percentage = kpis.openOpportunities > 0 ? Math.round((s.count / kpis.openOpportunities) * 100) : 0;
                return (
                  <div key={s.stage} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between font-medium">
                      <span className="text-slate-700">{s.stage}</span>
                      <span className="text-slate-900 font-bold">{s.count} deals ({percentage}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className="h-full bg-blue-600 transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(5, percentage))}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Leads by Status */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Leads by Status
            </h3>
            <Link href="/leads" className="text-xs font-semibold text-blue-600 hover:underline">
              View All Leads
            </Link>
          </div>

          <div className="space-y-3">
            {(!data?.leadsByStatus || data.leadsByStatus.length === 0) ? (
              <p className="text-xs text-slate-400 py-6 text-center">No leads recorded in this period.</p>
            ) : (
              data.leadsByStatus.map((s) => {
                const percentage = kpis.totalLeads > 0 ? Math.round((s.count / kpis.totalLeads) * 100) : 0;
                return (
                  <div key={s.status} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between font-medium">
                      <span className="text-slate-700">{s.status}</span>
                      <span className="text-slate-900 font-bold">{s.count} leads ({percentage}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className="h-full bg-blue-600 transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(5, percentage))}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Leads */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Recent Leads</h3>
            <Link href="/leads" className="text-xs text-blue-600 hover:underline font-semibold">
              View All
            </Link>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {(!data?.recentLeads || data.recentLeads.length === 0) ? (
              <p className="p-4 text-center text-slate-400">No recent leads</p>
            ) : (
              data.recentLeads.map((l) => (
                <div key={l.id} className="p-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between">
                  <div>
                    <Link href={`/leads/${l.id}`} className="font-semibold text-blue-600 hover:underline block">
                      {l.name}
                    </Link>
                    <span className="text-[11px] text-slate-500">{l.company}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    {l.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recently Created Accounts */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Recent Accounts</h3>
            <Link href="/accounts" className="text-xs text-blue-600 hover:underline font-semibold">
              View All
            </Link>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {(!data?.recentAccounts || data.recentAccounts.length === 0) ? (
              <p className="p-4 text-center text-slate-400">No accounts created</p>
            ) : (
              data.recentAccounts.map((a) => (
                <div key={a.id} className="p-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between">
                  <div>
                    <Link href={`/accounts/${a.id}`} className="font-semibold text-blue-600 hover:underline block">
                      {a.name}
                    </Link>
                    <span className="text-[11px] text-slate-500">{a.industry}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {a.contactsCount} Contacts · {a.oppsCount} Deals
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Recent Activity</h3>
            <Link href="/activities" className="text-xs text-blue-600 hover:underline font-semibold">
              View All
            </Link>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {(!data?.recentActivities || data.recentActivities.length === 0) ? (
              <p className="p-4 text-center text-slate-400">No recorded activities</p>
            ) : (
              data.recentActivities.map((act) => (
                <div key={act.id} className="p-3.5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 line-clamp-1">{act.subject}</span>
                    <span className="text-[10px] text-slate-400 shrink-0">{formatDate(act.createdAt)}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{act.relatedName}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
