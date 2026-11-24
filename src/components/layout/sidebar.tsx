"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  TrendingUp,
  Building2,
  Handshake,
  Boxes,
  FileSignature,
  Receipt,
  ShoppingCart,
  Activity,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavSection {
  title: string;
  items: {
    name: string;
    href: string;
    icon: any;
  }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Core CRM",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Leads", href: "/leads", icon: Users },
      { name: "Contacts", href: "/contacts", icon: UserCheck },
      { name: "Opportunities", href: "/opportunities", icon: TrendingUp },
      { name: "Accounts", href: "/accounts", icon: Building2 },
    ],
  },
  {
    title: "Operations & Partners",
    items: [
      { name: "Brokers", href: "/brokers", icon: Handshake },
      { name: "Projects", href: "/projects", icon: Building2 },
      { name: "Inventory", href: "/inventory", icon: Boxes },
    ],
  },
  {
    title: "Transactions",
    items: [
      { name: "EOI & Token", href: "/eoi", icon: FileSignature },
      { name: "Quotations", href: "/quotations", icon: Receipt },
      { name: "Purchase Orders", href: "/purchase-orders", icon: ShoppingCart },
    ],
  },
  {
    title: "Analytics & Settings",
    items: [
      { name: "Activities", href: "/activities", icon: Activity },
      { name: "Reports", href: "/reports", icon: BarChart3 },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-white text-slate-800 transition-all duration-300 flex flex-col border-r border-[#E2E8F0] shadow-xs",
        collapsed ? "w-[68px]" : "w-[260px]"
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-[#E2E8F0] shrink-0 bg-white">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden group">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 text-white shadow-xs">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="truncate">
              <span className="text-base font-bold tracking-tight text-slate-900 block leading-tight">
                PentaCloud
              </span>
              <span className="text-[10px] text-blue-600 tracking-wider uppercase font-semibold block font-mono">
                Salesforce CRM
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {NAV_SECTIONS.map((section, sIdx) => (
          <div key={section.title} className="space-y-0.5">
            {!collapsed ? (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1 font-mono">
                {section.title}
              </p>
            ) : (
              sIdx > 0 && <div className="my-2 border-t border-slate-200 mx-2" />
            )}

            <div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors group relative my-0.5",
                      isActive
                        ? "bg-blue-50 text-blue-600 font-semibold border-l-4 border-blue-600"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0 transition-colors",
                        isActive ? "text-blue-600" : "text-slate-600 group-hover:text-slate-900"
                      )}
                    />
                    {!collapsed && (
                      <span className="truncate flex-1">{item.name}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Info Footer */}
      {!collapsed && (
        <div className="px-3 py-2.5 border-t border-[#E2E8F0] bg-slate-50/50 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                AA
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
                  Ahmed Al Rashid
                </p>
                <p className="text-[10px] text-slate-600 font-mono">Admin</p>
              </div>
            </div>
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200">
              CRM
            </span>
          </div>
        </div>
      )}

      {/* Collapse Toggle Footer */}
      <div className="p-2 border-t border-[#E2E8F0] bg-white shrink-0">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors text-xs font-medium"
          title={collapsed ? "Expand Menu" : "Collapse Menu"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-blue-600" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 text-slate-500" />
              <span>Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
