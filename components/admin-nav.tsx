"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Boxes,
  ClipboardList,
  Gauge,
  Home,
  Layers3,
  LogOut,
  Search,
  Sprout,
  UsersRound
} from "lucide-react";
import { logoutAdmin } from "@/app/actions";

type AdminShellProps = {
  role: string;
  activeBatchName?: string | null;
  attentionCount: number;
  children: React.ReactNode;
};

const links = [
  { href: "/admin", label: "Today", icon: Gauge },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/customers", label: "Customers", icon: UsersRound },
  { href: "/admin/products", label: "Products", icon: Boxes },
  { href: "/admin/batches", label: "Batches", icon: Layers3 },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 }
];

export function AdminShell({ role, activeBatchName, attentionCount, children }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="admin-app-shell">
      <aside className="admin-sidebar">
        <div className="flex items-center gap-3 px-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-leaf-700 text-white shadow-crisp">
            <Sprout className="h-5 w-5" />
          </span>
          <div>
            <p className="font-black text-stone-950">Mango Admin</p>
            <p className="text-xs font-bold text-stone-500">Operations</p>
          </div>
        </div>
        <div className="mx-3 mt-5 rounded-lg border border-mango-100 bg-mango-50 p-3">
          <p className="text-[11px] font-black uppercase tracking-wide text-stone-500">Active batch</p>
          <p className="mt-1 line-clamp-2 text-sm font-black text-stone-950">{activeBatchName ?? "No active batch"}</p>
        </div>
        <nav className="mt-5 space-y-1 px-2">
          {links.map((link) => <AdminLink key={link.href} link={link} pathname={pathname} />)}
        </nav>
        <div className="mt-auto space-y-2 px-3 pb-4">
          <Link href="/" className="btn-secondary w-full justify-start">
            <Home className="h-4 w-4" />
            Customer Page
          </Link>
          <form action={logoutAdmin}>
            <button type="submit" className="btn-secondary w-full justify-start">
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
          <p className="px-1 text-xs font-bold capitalize text-stone-500">{role}</p>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar admin-safe-sticky">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wide text-leaf-700">Mango Admin</p>
            <p className="truncate text-sm font-bold text-stone-600">{activeBatchName ?? "No active batch active"}</p>
          </div>
          <form action="/admin/orders" className="hidden min-w-0 flex-1 md:block">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-stone-400" />
              <input name="search" className="field h-10 pl-9" placeholder="Search orders by name, phone, email, or order number" />
            </label>
          </form>
          <Link href="/admin/orders?quick=needs-payment" className={attentionCount > 0 ? "badge-warm shrink-0" : "badge-good shrink-0"}>
            {attentionCount > 0 ? <AlertTriangle className="h-3.5 w-3.5" /> : <Gauge className="h-3.5 w-3.5" />}
            {attentionCount} need action
          </Link>
          <Link href="/" className="btn-secondary hidden shrink-0 md:inline-flex">
            <Home className="h-4 w-4" />
            Back to Customer Page
          </Link>
          <form action={logoutAdmin} className="hidden md:block">
            <button type="submit" className="btn-secondary min-h-10 px-3 py-2">
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </header>

        <div className="border-b border-stone-200 bg-white px-4 py-3 md:hidden">
          <form action="/admin/orders">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-stone-400" />
              <input name="search" className="field h-10 pl-9" placeholder="Search orders" />
            </label>
          </form>
        </div>

        {children}

        <nav className="admin-mobile-nav admin-nav-scroll">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
            return (
              <Link key={href} href={href} className={active ? "admin-mobile-nav-item admin-mobile-nav-item-active" : "admin-mobile-nav-item"}>
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            );
          })}
          <Link href="/" className="admin-mobile-nav-item">
            <Home className="h-4 w-4" />
            <span>Customer</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}

function AdminLink({ link, pathname }: { link: (typeof links)[number]; pathname: string }) {
  const active = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href));
  const Icon = link.icon;
  return (
    <Link href={link.href} className={active ? "admin-sidebar-link admin-sidebar-link-active" : "admin-sidebar-link"}>
      <Icon className="h-4 w-4" />
      <span>{link.label}</span>
      {active && <ArrowUpRight className="ml-auto h-3.5 w-3.5" />}
    </Link>
  );
}
