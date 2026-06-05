"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: string;
  sub?: string;
  delay?: number;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  accent = "#8B5CF6",
  sub,
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="glass gradient-border rounded-2xl p-4 sm:p-5"
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `${accent}1f`, color: accent }}
        >
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted truncate">{label}</p>
          <p className="text-xl sm:text-2xl font-semibold leading-tight">
            {value}
          </p>
          {sub ? <p className="text-[11px] text-muted">{sub}</p> : null}
        </div>
      </div>
    </motion.div>
  );
}
