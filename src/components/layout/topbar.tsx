"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  Bell,
  Plus,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Menu,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TopBarProps {
  onMenuClick: () => void;
  sidebarCollapsed: boolean;
}

interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin / Ops",
  SALES_MANAGER: "Sales Manager",
  SALES_ADVISOR: "Sales Advisor",
  FINANCE: "Finance",
  COMPLIANCE: "Compliance",
  MANAGEMENT: "Executive",
};

export function TopBar({ onMenuClick, sidebarCollapsed }: TopBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/leads?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 h-16 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-4 md:px-6 transition-all duration-300",
        sidebarCollapsed ? "left-[68px]" : "left-[260px]",
        "max-md:left-0"
      )}
    >
      {/* Left side: mobile toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-[#F8FAFC]"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider font-semibold text-[#64748B] hidden sm:inline">
            Pentacloud
          </span>
          <span className="text-[#94A3B8] hidden sm:inline">/</span>
          <span className="text-sm font-semibold text-[#172033] capitalize">
            {pathname.split("/")[1] || "Dashboard"}
          </span>
        </div>
      </div>

      {/* Right side: Search, Actions, Notifications & User */}
      <div className="flex items-center gap-2 sm:gap-3">
        <form onSubmit={handleGlobalSearch} className="hidden md:flex relative">
          <div className="flex items-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-1.5 w-60 focus-within:border-[#2563EB] focus-within:ring-1 focus-within:ring-[#2563EB] transition-all">
            <Search className="w-4 h-4 text-[#94A3B8] mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search leads, units, buyers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-[#172033] placeholder:text-[#94A3B8] outline-none w-full"
            />
          </div>
        </form>

        <button
          onClick={() => router.push("/leads")}
          className="hidden sm:flex items-center gap-1.5 bg-[#153B66] hover:bg-[#102C4C] text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Lead</span>
        </button>

        <button
          onClick={() => router.push("/activities")}
          className="relative p-2 text-[#64748B] hover:text-[#172033] hover:bg-[#F8FAFC] rounded-lg transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#2563EB] rounded-full ring-2 ring-white" />
        </button>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#F8FAFC] transition-colors border border-transparent hover:border-[#E2E8F0]"
          >
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#153B66] font-bold text-xs uppercase">
              {user ? `${user.firstName[0]}${user.lastName[0]}` : "U"}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-semibold text-[#172033] leading-tight">
                {user ? `${user.firstName} ${user.lastName}` : "User"}
              </p>
              <p className="text-[10px] text-[#64748B] leading-tight">
                {user ? ROLE_LABELS[user.role] || user.role : "Role"}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] hidden md:block" />
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-lg border border-[#E2E8F0] py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-4 py-2.5 border-b border-[#E2E8F0]">
                  <p className="text-xs font-semibold text-[#172033]">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-[11px] text-[#64748B] truncate">
                    {user?.email}
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 bg-[#EFF6FF] text-[#153B66] rounded">
                    {user ? ROLE_LABELS[user.role] || user.role : ""}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    router.push("/settings");
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#172033] hover:bg-[#F8FAFC] transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-[#64748B]" />
                  System Settings
                </button>
                <div className="border-t border-[#E2E8F0] my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

