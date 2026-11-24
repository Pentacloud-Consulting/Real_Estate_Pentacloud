import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  colorMap?: Record<string, string>;
  className?: string;
}

const BLUE_WHITE_COLORS: Record<string, string> = {
  NEW: "bg-blue-50 text-blue-700 border-blue-200",
  ACTIVE: "bg-blue-50 text-blue-700 border-blue-200",
  CONTACTED: "bg-blue-50/70 text-blue-700 border-blue-200",
  QUALIFIED: "bg-blue-50 text-blue-700 border-blue-200 font-semibold",
  CONVERTED: "bg-slate-100 text-slate-700 border-slate-200",
  UNQUALIFIED: "bg-slate-100 text-slate-600 border-slate-200",
  HOT: "bg-blue-50 text-blue-700 border-blue-200 font-semibold",
  WARM: "bg-slate-100 text-slate-700 border-slate-200",
  COLD: "bg-slate-50 text-slate-500 border-slate-200",
  AVAILABLE: "bg-blue-50 text-blue-700 border-blue-200",
  RESERVED: "bg-blue-50/80 text-blue-800 border-blue-300 font-semibold",
  ON_HOLD: "bg-slate-100 text-slate-700 border-slate-200",
  SOLD: "bg-slate-900 text-white border-slate-900 font-semibold",
  BLOCKED: "bg-slate-100 text-slate-600 border-slate-200",
  UNAVAILABLE: "bg-slate-100 text-slate-500 border-slate-200",
  DRAFT: "bg-slate-50 text-slate-600 border-slate-200",
  SUBMITTED: "bg-blue-50 text-blue-700 border-blue-200",
  AWAITING_PAYMENT: "bg-slate-100 text-slate-700 border-slate-200",
  PAYMENT_PENDING_VERIFICATION: "bg-blue-50 text-blue-700 border-blue-200",
  PAYMENT_VERIFIED: "bg-blue-50 text-blue-700 border-blue-200 font-semibold",
  RESERVATION_ACTIVE: "bg-blue-50 text-blue-700 border-blue-200",
  PENDING: "bg-slate-100 text-slate-700 border-slate-200",
  APPROVED: "bg-blue-50 text-blue-700 border-blue-200 font-semibold",
  VERIFIED: "bg-blue-50 text-blue-700 border-blue-200 font-semibold",
  REJECTED: "bg-slate-100 text-slate-700 border-slate-300",
  EXPIRED: "bg-slate-100 text-slate-500 border-slate-200",
  CANCELLED: "bg-slate-100 text-slate-500 border-slate-200",
  COMPLETED: "bg-blue-50 text-blue-700 border-blue-200 font-semibold",
  IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
  PENDING_REVIEW: "bg-slate-100 text-slate-700 border-slate-200",
  NOT_STARTED: "bg-slate-50 text-slate-500 border-slate-200",
  CLOSED_WON: "bg-blue-600 text-white border-blue-600 font-semibold",
  CLOSED_LOST: "bg-slate-100 text-slate-600 border-slate-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200 font-semibold",
  SIGNED: "bg-blue-50 text-blue-700 border-blue-200 font-semibold",
  UPLOADED: "bg-slate-100 text-slate-700 border-slate-200",
  UNDER_REVIEW: "bg-blue-50 text-blue-700 border-blue-200",
  OVERDUE: "bg-slate-200 text-slate-800 border-slate-300 font-semibold",
  HIGH: "bg-blue-50 text-blue-700 border-blue-200 font-semibold",
  MEDIUM: "bg-slate-100 text-slate-700 border-slate-200",
  LOW: "bg-slate-50 text-slate-500 border-slate-200",
};

export function StatusBadge({ status, colorMap, className }: StatusBadgeProps) {
  const colors = { ...BLUE_WHITE_COLORS, ...colorMap };
  const colorClass = colors[status] || "bg-slate-100 text-slate-700 border-slate-200";
  const label = status ? status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "-";

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border",
        colorClass,
        className
      )}
    >
      {label}
    </span>
  );
}
