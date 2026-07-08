"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, BellRing, X, AlertTriangle, Flame } from "lucide-react";
import Avatar from "@/components/Avatar";
import { playBeep } from "@/lib/notify";
import type { EmployeePerformance } from "@/lib/types";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [missed, setMissed] = useState<EmployeePerformance[]>([]);
  const [seenCount, setSeenCount] = useState(0);
  const prevKey = useRef("");

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch("/api/analytics", { cache: "no-store" });
        const data = await res.json();
        const current: EmployeePerformance[] = data.needsAttention ?? [];
        const key = current.map((e: EmployeePerformance) => e.name).join(",");

        if (prevKey.current && key !== prevKey.current && current.length > 0) {
          // New misses detected
          playBeep();
        }
        prevKey.current = key;
        setMissed(current);
      } catch {
        // silent
      }
    }

    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, []);

  const unread = Math.max(0, missed.length - seenCount);

  function handleOpen() {
    setOpen((v) => !v);
    if (!open) {
      setSeenCount(missed.length);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative rounded-md p-1.5 text-faint transition-colors hover:bg-surface-2 hover:text-white"
        title="Notifications"
      >
        {unread > 0 ? (
          <BellRing size={16} className="text-bad" />
        ) : (
          <Bell size={16} />
        )}
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-bad px-1 text-[9px] font-bold text-white">
            {unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-edge bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-edge px-4 py-3">
              <span className="text-[13px] font-medium">Alerts</span>
              <button
                onClick={() => setOpen(false)}
                className="text-faint hover:text-white"
              >
                <X size={14} />
              </button>
            </div>

            {missed.length === 0 ? (
              <div className="px-4 py-6 text-center text-[13px] text-muted">
                Everyone is on track. 🎉
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto">
                {missed.map((emp) => (
                  <div
                    key={emp.name}
                    className="flex items-start gap-3 border-b border-edge/50 px-4 py-3 last:border-b-0 hover:bg-surface-2/40"
                  >
                    <Avatar name={emp.name} size={28} />
                    <div className="min-w-0 flex-1 leading-tight">
                      <p className="truncate text-[13px]">{emp.name}</p>
                      <div className="mt-0.5 flex flex-wrap gap-1">
                        {emp.warnings.includes("missed_today") && (
                          <span className="inline-flex items-center gap-1 rounded bg-bad/10 px-1.5 py-0.5 text-[10px] text-bad">
                            <AlertTriangle size={9} />
                            Missed today
                          </span>
                        )}
                        {emp.warnings.includes("missed_yesterday") && (
                          <span className="inline-flex items-center gap-1 rounded bg-bad/10 px-1.5 py-0.5 text-[10px] text-bad">
                            Missed yesterday
                          </span>
                        )}
                        {emp.warnings.includes("no_activity_7d") && (
                          <span className="inline-flex items-center gap-1 rounded bg-[#fbbf24]/10 px-1.5 py-0.5 text-[10px] text-[#fbbf24]">
                            No activity 7d
                          </span>
                        )}
                        {emp.warnings.includes("streak_broken") && (
                          <span className="inline-flex items-center gap-1 rounded bg-[#fbbf24]/10 px-1.5 py-0.5 text-[10px] text-[#fbbf24]">
                            <Flame size={9} />
                            Streak broken
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-edge px-4 py-2 text-[10px] text-faint">
              Auto-checks every 30s · Sound on new alert
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
