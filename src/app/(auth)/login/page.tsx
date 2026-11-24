"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Building2, Loader2, CheckCircle, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@pentacloud.com");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("An error occurred during sign-in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword("admin123");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#102C4C] relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2563EB] rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">PentaCloud</h1>
              <p className="text-xs text-blue-200">Real Estate Operating Platform</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-lg my-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-medium mb-6 backdrop-blur-sm border border-white/10">
            <ShieldCheck className="w-3.5 h-3.5 text-[#3B82F6]" />
            Enterprise Sales & Buyer Onboarding
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight mb-4">
            Unified Real Estate Lifecycle Management
          </h2>
          <p className="text-slate-300 text-base leading-relaxed mb-8">
            Complete digital pipeline from multi-channel lead acquisition to unit reservation, payment milestone verification, KYC document vault, and handover readiness.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {[
              { title: "Lead to Buyer", desc: "Automated qualification & 360 profile" },
              { title: "Smart Inventory", desc: "Atomic locks & transaction-safe EOI" },
              { title: "Formal Quotations", desc: "Milestone payment schedules & PDFs" },
              { title: "KYC Onboarding", desc: "Role-based verification & audit trails" },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xs"
              >
                <div className="flex items-center gap-2 text-white font-semibold text-sm mb-1">
                  <CheckCircle className="w-4 h-4 text-[#3B82F6]" />
                  {feature.title}
                </div>
                <p className="text-xs text-slate-300">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-400">
          © {new Date().getFullYear()} PentaCloud Consulting. Enterprise Edition.
        </div>
      </div>

      {/* Right Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-[#F8FAFC]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 bg-[#102C4C] rounded-xl flex items-center justify-center text-white">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#102C4C]">PentaCloud</h1>
              <p className="text-xs text-[#64748B]">Real Estate Platform</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#172033] tracking-tight">
                Sign in to your account
              </h2>
              <p className="text-sm text-[#64748B] mt-1">
                Enter your credentials to access the sales platform
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#172033] mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@pentacloud.com"
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#172033] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#172033]">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#172033] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-[#153B66] hover:bg-[#102C4C] text-white py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>

            {/* Quick Demo Logins */}
            <div className="mt-6 pt-5 border-t border-[#E2E8F0]">
              <p className="text-xs font-semibold text-[#64748B] mb-2 uppercase tracking-wider">
                Demo Accounts (Password: admin123)
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: "Super Admin", email: "admin@pentacloud.com" },
                  { label: "Sales Advisor", email: "advisor1@pentacloud.com" },
                  { label: "Sales Manager", email: "manager@pentacloud.com" },
                  { label: "Compliance", email: "compliance@pentacloud.com" },
                  { label: "Finance", email: "finance@pentacloud.com" },
                  { label: "Operations", email: "ops@pentacloud.com" },
                ].map((role) => (
                  <button
                    key={role.email}
                    type="button"
                    onClick={() => handleQuickLogin(role.email)}
                    className="p-1.5 text-left border border-[#E2E8F0] rounded-lg hover:bg-[#EFF6FF] hover:border-[#BFDBFE] transition-colors"
                  >
                    <p className="font-semibold text-[#172033]">{role.label}</p>
                    <p className="text-[10px] text-[#64748B] truncate">{role.email}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

