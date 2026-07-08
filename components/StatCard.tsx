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
  accent = "#b4573c",
  sub,
}: StatCardProps) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="kicker truncate">{label}</span>
        <span
          className="flex h-6 w-6 items-center justify-center border-[1.5px] border-ink"
          style={{ background: accent }}
        >
          <Icon size={13} className="text-paper" strokeWidth={2.25} />
        </span>
      </div>
      <p className="display mt-3 text-[38px] leading-none tabular-nums">
        {value}
      </p>
      {sub ? <p className="mt-1.5 text-xs text-ink-faint">{sub}</p> : null}
    </div>
  );
}
