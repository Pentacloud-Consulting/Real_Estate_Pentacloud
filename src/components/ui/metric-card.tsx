import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  subtitle?: string;
  trend?: { value: number; label: string };
  className?: string;
  onClick?: () => void;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  className,
  onClick,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-[#E2E8F0] p-5 transition-all duration-200 shadow-sm",
        onClick && "cursor-pointer hover:border-[#3B82F6] hover:shadow-md",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider">
            {title}
          </p>
          <p className="text-2xl font-bold text-[#172033] tracking-tight">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-[#94A3B8]">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 pt-1">
              <span
                className={cn(
                  "text-xs font-semibold",
                  trend.value >= 0 ? "text-emerald-600" : "text-rose-600"
                )}
              >
                {trend.value >= 0 ? "+" : ""}
                {trend.value}%
              </span>
              <span className="text-xs text-[#94A3B8]">{trend.label}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-[#2563EB]" />
          </div>
        )}
      </div>
    </div>
  );
}

