import Link from "next/link";
import { BarChart3, Boxes, ClipboardList, Layers3, LogOut, Sprout, UsersRound } from "lucide-react";
import { logoutAdmin } from "@/app/actions";

export function AdminNav({ role }: { role: string }) {
  const links = [
    { href: "/admin/orders", label: "Orders", icon: ClipboardList },
    { href: "/admin/customers", label: "Customers", icon: UsersRound },
    { href: "/admin/products", label: "Products", icon: Boxes },
    { href: "/admin/batches", label: "Batches", icon: Layers3 },
    { href: "/admin/reports", label: "Reports", icon: BarChart3 }
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/90 backdrop-blur-xl">
      <div className="shell flex flex-wrap items-center justify-between gap-3 py-3">
        <Link href="/admin" className="flex items-center gap-2 font-black text-stone-950">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-leaf-700 text-white shadow-crisp">
            <Sprout className="h-5 w-5" />
          </span>
          Mango Admin
        </Link>
        <nav className="flex flex-wrap items-center gap-1.5 text-sm">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} className="inline-flex items-center gap-2 rounded-md px-3 py-2 font-bold text-stone-700 transition hover:bg-leaf-50 hover:text-leaf-700" href={href}>
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
          <span className="badge-good capitalize">{role}</span>
          <form action={logoutAdmin}>
            <button className="btn-secondary min-h-10 px-3 py-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
