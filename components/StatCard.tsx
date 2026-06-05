import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: string;
  sub?: string;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  accent = "#8e8e96",
  sub,
}: StatCardProps) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="kicker truncate">{label}</span>
        <Icon size={15} style={{ color: accent }} strokeWidth={1.75} />
      </div>
      <p className="mt-2.5 text-[26px] font-semibold leading-none tabular-nums tracking-tight">
        {value}
      </p>
      {sub ? <p className="mt-1.5 text-xs text-faint">{sub}</p> : null}
    </div>
  );
}
