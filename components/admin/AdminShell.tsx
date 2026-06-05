"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Trophy,
  BarChart3,
  Users,
  LogOut,
  Menu,
  X,
  Bell,
  Loader2,
} from "lucide-react";
import Avatar from "@/components/Avatar";
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
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  const today = new Date().toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 p-1">
          <Image src="/logo.png" alt="Reddit Tracker" width={30} height={30} />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">Reddit Tracker</p>
          <p className="text-[10px] text-muted">Admin Panel</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-primary/15 text-white glow-primary"
                  : "text-muted hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon
                size={17}
                className={active ? "text-primary" : undefined}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/5 p-4">
        <div className="flex items-center gap-3">
          <Avatar name={session.name} size={34} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{session.name}</p>
            <p className="text-[10px] text-muted">Administrator</p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="text-muted transition hover:text-red-400"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="glass sticky top-0 hidden h-screen w-60 shrink-0 border-r border-white/5 lg:block">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <aside className="glass absolute left-0 top-0 h-full w-64 border-r border-white/5">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 text-muted hover:text-white"
            >
              <X size={18} />
            </button>
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="glass sticky top-0 z-30 flex items-center gap-3 border-b border-white/5 px-4 py-3 sm:px-6">
          <button
            onClick={() => setOpen(true)}
            className="text-muted hover:text-white lg:hidden"
          >
            <Menu size={20} />
          </button>
          <p className="hidden text-sm text-muted sm:block">{today}</p>
          <div className="flex-1" />
          <button className="relative text-muted transition hover:text-white">
            <Bell size={18} />
            <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
          </button>
          <Avatar name={session.name} size={30} />
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
