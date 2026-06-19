"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Boxes, ClipboardList, Gauge, Layers3, LogOut, Sprout, UsersRound } from "lucide-react";
import { logoutAdmin } from "@/app/actions";

export function AdminNav({ role }: { role: string }) {
  const pathname = usePathname();
  const links = [
    { href: "/admin", label: "Today", icon: Gauge },
    { href: "/admin/orders", label: "Orders", icon: ClipboardList },
    { href: "/admin/customers", label: "Customers", icon: UsersRound },
    { href: "/admin/products", label: "Products", icon: Boxes },
    { href: "/admin/batches", label: "Batches", icon: Layers3 },
    { href: "/admin/reports", label: "Reports", icon: BarChart3 }
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white admin-safe-sticky">
      <div className="shell flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/admin" className="flex items-center gap-2 font-black text-stone-950">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-leaf-700 text-white shadow-crisp">
            <Sprout className="h-5 w-5" />
          </span>
          Mango Admin
        </Link>
        <nav className="admin-nav-scroll -mx-1 flex gap-1 overflow-x-auto px-1 text-sm lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              className={pathname === href || (href !== "/admin" && pathname.startsWith(href)) ? "admin-nav-link admin-nav-link-active" : "admin-nav-link"}
              href={href}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          ))}
          <span className="badge-good shrink-0 capitalize">{role}</span>
          <form action={logoutAdmin}>
            <button type="submit" className="btn-secondary min-h-10 shrink-0 px-3 py-2">
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
