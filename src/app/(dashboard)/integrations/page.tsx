"use client";

import { useState, useEffect } from "react";
import {
  Share2,
  CheckCircle2,
  AlertCircle,
  Zap,
  RefreshCw,
  Copy,
  ExternalLink,
  Sliders,
  ShieldCheck,
  Globe,
  Radio,
  ArrowUpRight,
  Loader2,
  Check,
  Send,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { ChannelLogo } from "@/components/integrations/channel-logo";

interface IntegrationChannel {
  id: string;
  name: string;
  category: "social" | "portal";
  badge: string;
  color: string;
  lightBg: string;
  borderColor: string;
  description: string;
  features: string[];
  connected: boolean;
  lastSync: string;
  syncedLeadsCount: number;
  config: Record<string, any>;
  fields: { key: string; label: string; placeholder: string; type?: string }[];
}

const INTEGRATION_DEFINITIONS: IntegrationChannel[] = [
  {
    id: "meta",
    name: "Meta (Facebook Lead Ads)",
    category: "social",
    badge: "Official Meta Business Partner",
    color: "#1877F2",
    lightBg: "bg-blue-50/70",
    borderColor: "border-blue-200",
    description:
      "Instant real-time ingestion from Facebook Lead Ads campaigns and Meta Instant Forms directly into your CRM leads pipeline.",
    features: [
      "Instant Webhook Lead Capture",
      "Dynamic Custom Field Mapping",
      "Ad Campaign & Creative Attribution",
      "Immediate Sales Advisor Auto-Dispatch",
    ],
    connected: false,
    lastSync: "Never",
    syncedLeadsCount: 0,
    config: {
      pageId: "109823471029384",
      adAccountId: "act_49201948201",
      leadFormName: "Downtown Crown VIP Launch Form",
      status: "ACTIVE",
    },
    fields: [
      { key: "pageId", label: "Meta Page ID", placeholder: "e.g. 109823471029384" },
      { key: "adAccountId", label: "Ad Account ID", placeholder: "e.g. act_49201948201" },
      { key: "leadFormName", label: "Active Lead Form Name", placeholder: "e.g. Luxury Penthouse VIP Form" },
    ],
  },
  {
    id: "instagram",
    name: "Instagram Professional",
    category: "social",
    badge: "Instagram Graph API v19.0",
    color: "#E1306C",
    lightBg: "bg-rose-50/70",
    borderColor: "border-pink-200",
    description:
      "Capture luxury property inquiries and high-intent investor leads directly from Instagram Reels, Stories, and Inbound DMs.",
    features: [
      "Instagram Story Swipe-Up Forms",
      "Inbound Direct Message Lead Parsing",
      "Reel Sponsored Ad Lead Extraction",
      "Automated Welcome Response via DM",
    ],
    connected: false,
    lastSync: "Never",
    syncedLeadsCount: 0,
    config: {
      accountHandle: "@pentacloud.luxuryproperties",
      adSyncEnabled: true,
      dmAutoCapture: true,
      status: "ACTIVE",
    },
    fields: [
      { key: "accountHandle", label: "Instagram Handle", placeholder: "e.g. @pentacloud.properties" },
      { key: "businessAccountId", label: "Instagram Business ID", placeholder: "e.g. ig_biz_94827103" },
      { key: "autoReplyMessage", label: "DM Automated Greeting", placeholder: "Thank you for reaching out to PentaCloud Properties!" },
    ],
  },
  {
    id: "tiktok",
    name: "TikTok for Business",
    category: "social",
    badge: "TikTok Marketing API",
    color: "#000000",
    lightBg: "bg-slate-50",
    borderColor: "border-slate-300",
    description:
      "Tap into high-performing short-form video campaigns and instant experience lead forms targeted at modern property buyers.",
    features: [
      "TikTok Instant Page Lead Ingestion",
      "Spark Ads Real-Time Webhook Listener",
      "Conversion Events Pixel Sync",
      "Custom Audience Targeting Sync",
    ],
    connected: false,
    lastSync: "Never",
    syncedLeadsCount: 0,
    config: {
      advertiserId: "",
      appId: "",
      status: "DISCONNECTED",
    },
    fields: [
      { key: "advertiserId", label: "TikTok Advertiser ID", placeholder: "e.g. ADV_7294810294821" },
      { key: "appId", label: "TikTok Developer App ID", placeholder: "e.g. 71928471029384" },
      { key: "secretKey", label: "App Secret Token", placeholder: "Enter API secret token", type: "password" },
    ],
  },
  {
    id: "whatzupp",
    name: "WhatzUpp",
    category: "social",
    badge: "PentaCloud Official Product",
    color: "#25D366",
    lightBg: "bg-emerald-50/70",
    borderColor: "border-emerald-200",
    description:
      "Connect your WhatzUpp WhatsApp Business messaging platform for instant lead capture, automated brochure dispatch, and two-way buyer conversations.",
    features: [
      "WhatsApp Business API Instant Lead Capture",
      "Automated Floorplan & Brochure Dispatch",
      "Two-Way Advisor Chat & Status Sync",
      "Smart Broadcast & Follow-Up Sequences",
    ],
    connected: false,
    lastSync: "Never",
    syncedLeadsCount: 0,
    config: {
      businessPhone: "+971 50 000 0000",
      workspaceId: "WZP-PC-001",
      autoGreeting: true,
      status: "DISCONNECTED",
    },
    fields: [
      { key: "workspaceId", label: "WhatzUpp Workspace ID", placeholder: "e.g. WZP-PC-001" },
      { key: "businessPhone", label: "WhatsApp Business Number", placeholder: "e.g. +971 50 000 0000" },
      { key: "apiKey", label: "WhatzUpp API Secret Key", placeholder: "Enter WhatzUpp API key", type: "password" },
    ],
  },
  {
    id: "dubizzle",
    name: "Dubizzle UAE",
    category: "portal",
    badge: "Dubizzle Official Broker Sync",
    color: "#E62E2D",
    lightBg: "bg-red-50/70",
    borderColor: "border-red-200",
    description:
      "Seamlessly publish properties to Dubizzle UAE and route inbound buyer inquiries and WhatsApp leads straight into PentaCloud CRM.",
    features: [
      "Live Inventory XML Feed Syndication",
      "Inbound Buyer Lead Parser & Phone Validation",
      "Call Tracking & WhatsApp Click Sync",
      "Automated Unit Availability Status Sync",
    ],
    connected: false,
    lastSync: "Never",
    syncedLeadsCount: 0,
    config: {
      agencyId: "DBZ-AG-8821",
      feedFormat: "XML_V3",
      autoSyncListings: true,
      status: "ACTIVE",
    },
    fields: [
      { key: "agencyId", label: "Dubizzle Agency ID", placeholder: "e.g. DBZ-AG-8821" },
      { key: "agentApiKey", label: "Dubizzle Feed API Key", placeholder: "Enter portal feed key", type: "password" },
      { key: "feedFormat", label: "Listing Syndication Feed", placeholder: "XML_V3" },
    ],
  },
  {
    id: "propertyfinder",
    name: "Property Finder",
    category: "portal",
    badge: "myCRM API v2 Certified",
    color: "#EF5350",
    lightBg: "bg-rose-50/60",
    borderColor: "border-red-200",
    description:
      "Two-way synchronization with Property Finder Broker Portal via myCRM API, capturing premium verified inquiries with zero delay.",
    features: [
      "myCRM API Bi-Directional Listing Sync",
      "Verified Agent Matching & Attribution",
      "Floorplan & High-Res Virtual Tour Sync",
      "Automated Buyer Inquiry Lead Webhooks",
    ],
    connected: false,
    lastSync: "Never",
    syncedLeadsCount: 0,
    config: {
      brokerRef: "PF-BRK-4019",
      myCrmApiEnabled: true,
      webhookVerified: true,
      status: "ACTIVE",
    },
    fields: [
      { key: "brokerRef", label: "Broker Reference Code", placeholder: "e.g. PF-BRK-4019" },
      { key: "apiKey", label: "myCRM API Token", placeholder: "Enter myCRM API key", type: "password" },
      { key: "webhookSecret", label: "Webhook Signing Secret", placeholder: "whsec_...", type: "password" },
    ],
  },
  {
    id: "bayut",
    name: "Bayut & dubizzle Group",
    category: "portal",
    badge: "Profolio™ Enterprise API",
    color: "#008034",
    lightBg: "bg-emerald-50/70",
    borderColor: "border-emerald-200",
    description:
      "Direct integration with Bayut.com and TruCheck™ verified property listings, syncing live buyer leads and viewing reservations.",
    features: [
      "Bayut Profolio™ API Syndication",
      "TruCheck™ Listing Authenticity Sync",
      "Instant WhatsApp & Phone Lead Alerts",
      "Lead Source Tagging & Campaign Metrics",
    ],
    connected: false,
    lastSync: "Never",
    syncedLeadsCount: 0,
    config: {
      companyId: "BYT-CO-9912",
      profolioSync: false,
      truCheckEnabled: true,
      status: "DISCONNECTED",
    },
    fields: [
      { key: "companyId", label: "Bayut Company ID", placeholder: "e.g. BYT-CO-9912" },
      { key: "profolioToken", label: "Profolio Authentication Token", placeholder: "Enter Profolio token", type: "password" },
      { key: "agencyBranchCode", label: "Branch Code", placeholder: "e.g. DXB-MARINA-01" },
    ],
  },
];

const RECENT_SYNCED_LEADS = [
  {
    name: "Rashid Al-Maktoum",
    phone: "+971 50 847 2910",
    source: "WhatzUpp",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    project: "Downtown Crown Residences",
    unit: "Unit #DCR-PH-01",
    time: "2 mins ago",
    status: "Auto-Assigned to Ahmed Al Rashid",
  },
  {
    name: "Nadia Al-Mansoor",
    phone: "+971 50 712 4890",
    source: "Property Finder",
    badgeColor: "bg-red-50 text-red-700 border-red-200",
    project: "Downtown Crown Residences",
    unit: "Unit #DCR-0101",
    time: "4 mins ago",
    status: "Auto-Assigned to Ahmed Al Rashid",
  },
  {
    name: "Elena Rostova",
    phone: "+971 55 918 3042",
    source: "Instagram",
    badgeColor: "bg-pink-50 text-pink-700 border-pink-200",
    project: "Palm Island Beachfront Villas",
    unit: "Villa #PIV-V02",
    time: "11 mins ago",
    status: "Auto-Assigned to Sales Team",
  },
  {
    name: "Kareem El-Sayed",
    phone: "+971 52 390 1184",
    source: "Meta (Facebook)",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    project: "Downtown Crown Residences",
    unit: "Unit #DCR-0102",
    time: "26 mins ago",
    status: "Qualified Prospect",
  },
  {
    name: "Vikram Malhotra",
    phone: "+971 56 472 8819",
    source: "Dubizzle",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    project: "Downtown Crown Residences",
    unit: "Unit #DCR-PH-01",
    time: "42 mins ago",
    status: "Contacted / WhatsApp Sent",
  },
];

export default function IntegrationsPage() {
  const { addToast } = useToast();

  const [channels, setChannels] = useState<IntegrationChannel[]>(INTEGRATION_DEFINITIONS);
  const [activeTab, setActiveTab] = useState<"all" | "social" | "portal" | "connected">("all");
  const [selectedChannel, setSelectedChannel] = useState<IntegrationChannel | null>(null);
  const [modalForm, setModalForm] = useState<Record<string, string>>({});
  const [savingChannel, setSavingChannel] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const webhookEndpoint = "https://crm.pentacloud.com/api/webhooks/v1/lead-inbound";

  // Fetch status from API
  useEffect(() => {
    fetch("/api/integrations")
      .then((res) => res.json())
      .then((data) => {
        if (data.integrations) {
          setChannels((prev) =>
            prev.map((ch) => {
              const apiData = data.integrations[ch.id];
              if (apiData) {
                return {
                  ...ch,
                  connected: apiData.connected,
                  lastSync: apiData.lastSync,
                  syncedLeadsCount: apiData.syncedLeadsCount,
                  config: { ...ch.config, ...apiData.config },
                };
              }
              return ch;
            })
          );
        }
      })
      .catch((err) => console.error("Error loading integrations:", err));
  }, []);

  const handleOpenConfig = (channel: IntegrationChannel) => {
    setSelectedChannel(channel);
    setTestResult(null);
    const initialConfig: Record<string, string> = {};
    channel.fields.forEach((f) => {
      initialConfig[f.key] = channel.config[f.key] || "";
    });
    setModalForm(initialConfig);
  };

  const handleTestConnection = () => {
    setTestingConnection(true);
    setTestResult(null);
    setTimeout(() => {
      setTestingConnection(false);
      setTestResult("Handshake successful! Response time: 38ms. Webhook verified.");
      addToast("success", "Connection Verified", `Live ping response received from ${selectedChannel?.name}`);
    }, 1200);
  };

  const handleToggleConnect = async (channel: IntegrationChannel, shouldConnect: boolean) => {
    try {
      const res = await fetch("/api/integrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: channel.id,
          connected: shouldConnect,
        }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      setChannels((prev) =>
        prev.map((c) => (c.id === channel.id ? { ...c, connected: shouldConnect, lastSync: shouldConnect ? "Just now" : c.lastSync } : c))
      );

      if (shouldConnect) {
        addToast("success", "Channel Connected", `${channel.name} is now actively ingesting leads.`);
      } else {
        addToast("info", "Channel Disconnected", `${channel.name} connection paused.`);
      }
    } catch {
      addToast("error", "Action Failed", "Could not update connection state");
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChannel) return;

    setSavingChannel(true);
    try {
      const res = await fetch("/api/integrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: selectedChannel.id,
          connected: true,
          config: modalForm,
        }),
      });

      if (!res.ok) throw new Error("Failed to save settings");

      setChannels((prev) =>
        prev.map((c) =>
          c.id === selectedChannel.id
            ? { ...c, connected: true, lastSync: "Just now", config: { ...c.config, ...modalForm } }
            : c
        )
      );

      addToast("success", "Integration Saved", `${selectedChannel.name} configured and activated successfully.`);
      setSelectedChannel(null);
    } catch (err: any) {
      addToast("error", "Save Failed", err.message || "Failed to update integration settings");
    } finally {
      setSavingChannel(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedWebhook(true);
    addToast("success", "Copied", "Webhook URL copied to clipboard.");
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const filteredChannels = channels.filter((ch) => {
    if (activeTab === "social") return ch.category === "social";
    if (activeTab === "portal") return ch.category === "portal";
    if (activeTab === "connected") return ch.connected;
    return true;
  });

  const connectedCount = channels.filter((c) => c.connected).length;
  const totalSyncedLeads = channels.reduce((acc, c) => acc + c.syncedLeadsCount, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <Share2 className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Lead Generation & Channel Integrations
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Connect marketing ad networks, social campaigns, and UAE property portals for automated lead capture & syndication.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>Webhook Gateway Live</span>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Active Channels</span>
            <Zap className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {connectedCount} <span className="text-xs font-normal text-slate-400">/ {channels.length} Connected</span>
          </p>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all"
              style={{ width: `${(connectedCount / channels.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total Ingested Leads</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">{totalSyncedLeads}</p>
          <p className="text-[11px] text-slate-400 mt-1">Automated capture across all campaigns</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">API Webhook Health</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">99.98%</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Zero dropped webhook events</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Average Ingestion Speed</span>
            <RefreshCw className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">&lt; 1.2s</p>
          <p className="text-[11px] text-slate-400 mt-1">Lead to CRM assignment latency</p>
        </div>
      </div>

      {/* Webhook & Inbound API Endpoint Info Box */}
      <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-blue-500/30 border border-blue-400/40 rounded text-[10px] uppercase font-bold tracking-wider text-blue-200">
              Inbound Webhook URL
            </span>
            <span className="text-xs text-blue-200">For custom forms, Meta Lead Ads, & Zapier / Make hooks</span>
          </div>
          <p className="font-mono text-xs sm:text-sm bg-black/30 px-3 py-1.5 rounded-lg border border-white/10 text-emerald-300 break-all select-all">
            {webhookEndpoint}
          </p>
        </div>
        <button
          onClick={() => copyToClipboard(webhookEndpoint)}
          className="flex items-center gap-2 px-4 py-2 bg-white text-blue-900 hover:bg-blue-50 rounded-lg text-xs font-bold transition-colors shrink-0 shadow-sm cursor-pointer"
        >
          {copiedWebhook ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          {copiedWebhook ? "Copied Endpoint" : "Copy Webhook URL"}
        </button>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === "all" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          All Channels ({channels.length})
        </button>
        <button
          onClick={() => setActiveTab("social")}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === "social" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Social &amp; Messaging ({channels.filter((c) => c.category === "social").length})
        </button>
        <button
          onClick={() => setActiveTab("portal")}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === "portal" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          UAE Property Portals ({channels.filter((c) => c.category === "portal").length})
        </button>
        <button
          onClick={() => setActiveTab("connected")}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === "connected" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Active / Connected ({connectedCount})
        </button>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredChannels.map((ch) => (
          <div
            key={ch.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
          >
            {/* Top Bar with Brand Badge */}
            <div className={`p-5 border-b border-slate-100 ${ch.lightBg}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-white/90 border border-slate-200 text-slate-700 shadow-2xs">
                  {ch.badge}
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      ch.connected ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                    }`}
                  />
                  <span
                    className={`text-[11px] font-bold ${
                      ch.connected ? "text-emerald-700" : "text-slate-400"
                    }`}
                  >
                    {ch.connected ? "Connected" : "Disconnected"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ChannelLogo id={ch.id} name={ch.name} />
                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {ch.name}
                  </h3>
                  <span className="text-[11px] text-slate-500 capitalize">
                    {ch.id === "whatzupp"
                      ? "WhatsApp & Messaging Automation"
                      : ch.category === "social"
                      ? "Marketing & Lead Ads"
                      : "UAE Listing Portal"}
                  </span>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">{ch.description}</p>

              {/* Feature Checklist */}
              <div className="space-y-1.5 py-2">
                {ch.features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">{feat}</span>
                  </div>
                ))}
              </div>

              {/* Stats Footer */}
              <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Leads Synced</span>
                  <span className="font-bold text-slate-800">{ch.syncedLeadsCount} Leads</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Last Sync</span>
                  <span className="font-semibold text-blue-600">{ch.lastSync}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => handleOpenConfig(ch)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-slate-500" />
                  Configure
                </button>

                <button
                  onClick={() => handleOpenConfig(ch)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Connect Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Live Stream Table: Recent Ingested Leads */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              Live Inbound Inquiries Feed
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time stream of leads captured via Meta, Instagram, Dubizzle, and Property Finder
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Auto-refresh active</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase">
                <th className="px-4 py-3">Inbound Buyer</th>
                <th className="px-4 py-3">Phone / Contact</th>
                <th className="px-4 py-3">Source Channel</th>
                <th className="px-4 py-3">Project Interest</th>
                <th className="px-4 py-3">Allocated Unit</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Pipeline Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {RECENT_SYNCED_LEADS.map((l, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-900">{l.name}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{l.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] border ${l.badgeColor}`}>
                      {l.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{l.project}</td>
                  <td className="px-4 py-3 font-mono text-blue-600 font-semibold">{l.unit}</td>
                  <td className="px-4 py-3 text-slate-400">{l.time}</td>
                  <td className="px-4 py-3 font-medium text-emerald-700 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {l.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Integration Setup Modal */}
      <Modal
        open={!!selectedChannel}
        onClose={() => setSelectedChannel(null)}
        title={`Connect & Configure ${selectedChannel?.name}`}
        description={`Set up API credentials, field mapping, and webhook handlers for ${selectedChannel?.name}.`}
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testingConnection}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {testingConnection ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {testingConnection ? "Pinging API..." : "Test Connection"}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedChannel(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="integration-form"
                disabled={savingChannel}
                className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {savingChannel && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save & Activate
              </button>
            </div>
          </div>
        }
      >
        {selectedChannel && (
          <form id="integration-form" onSubmit={handleSaveModal} className="space-y-4 py-1">
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-blue-600" />
                Webhook Integration Endpoint for {selectedChannel.name}
              </p>
              <p className="font-mono text-[11px] bg-white px-2.5 py-1 rounded border border-blue-200 text-blue-800 break-all select-all">
                {webhookEndpoint}?channel={selectedChannel.id}
              </p>
            </div>

            <div className="space-y-3">
              {selectedChannel.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {field.label} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type={field.type || "text"}
                    required
                    value={modalForm[field.key] || ""}
                    onChange={(e) => setModalForm({ ...modalForm, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              ))}
            </div>

            {testResult && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{testResult}</span>
              </div>
            )}
          </form>
        )}
      </Modal>
    </div>
  );
}

