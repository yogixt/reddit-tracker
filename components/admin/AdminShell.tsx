"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Trophy,
  BarChart3,
  Users,
  Bell,
  LogOut,
  Menu,
  X,
  Loader2,
} from "lucide-react";
import Avatar from "@/components/Avatar";
import NotificationBell from "@/components/admin/NotificationBell";
import {
  clearAdminSession,
  getAdminSession,
  type AdminSession,
} from "@/lib/session";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/employees", label: "Employees", icon: Users },
  { href: "/admin/notifications", label: "Alerts", icon: Bell },
];

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [checked, setChecked] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const s = getAdminSession();
    if (!s) {
      router.replace("/admin/login");
      return;
    }
    setSession(s);
    setChecked(true);
  }, [router]);

  function handleLogout() {
    clearAdminSession();
    router.push("/");
  }

  if (!checked || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 size={24} className="animate-spin text-faint" />
      </div>
    );
  }

  const today = new Date().toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-4 pb-4 pt-5">
        <span className="h-2.5 w-2.5 rounded-full bg-accent" />
        <div className="leading-tight">
          <p className="text-[13px] font-semibold">Tracker</p>
          <p className="text-[10px] text-faint">internal</p>
        </div>
      </div>

      <p className="kicker px-4 pb-2 pt-3">Menu</p>
      <nav className="flex-1 space-y-0.5 px-2">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-colors ${
                active
                  ? "bg-surface-2 text-white"
                  : "text-muted hover:bg-surface-2/60 hover:text-white"
              }`}
            >
              {active ? (
                <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-accent" />
              ) : null}
              <item.icon
                size={16}
                strokeWidth={1.75}
                className={active ? "text-accent" : undefined}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-edge p-3">
        <div className="flex items-center gap-2.5">
          <Avatar name={session.name} size={30} />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[13px] font-medium">{session.name}</p>
            <p className="text-[10px] text-faint">admin</p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="rounded-md p-1.5 text-faint transition-colors hover:bg-surface-2 hover:text-bad"
          >
            <LogOut size={15} />
          </button>
        </div>
        <p className="mt-3 text-[10px] text-faint">
          Reddit · Quora · LinkedIn tracker
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 border-r border-edge bg-surface lg:block">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-60 border-r border-edge bg-surface">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 text-faint hover:text-white"
            >
              <X size={17} />
            </button>
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b border-edge bg-bg/90 px-4 backdrop-blur-sm sm:px-6">
          <button
            onClick={() => setOpen(true)}
            className="text-muted hover:text-white lg:hidden"
          >
            <Menu size={18} />
          </button>
          <p className="text-xs text-faint">{today}</p>
          <div className="flex-1" />
          <NotificationBell />
          <span className="flex items-center gap-1.5 text-[11px] text-muted">
            <span className="dot bg-ok" />
            live
          </span>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
