"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Package,
  Users,
  Truck,
  BookOpen,
  BarChart3,
  Settings,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarProps {
  tenantId: string;
  collapsed?: boolean;
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard",   href: "dashboard" },
  { icon: FileText,        label: "Faturas",      href: "invoices" },
  { icon: Package,         label: "Produtos",     href: "products" },
  { icon: Users,           label: "Clientes",     href: "customers" },
  { icon: Truck,           label: "Fornecedores", href: "suppliers" },
  { icon: BookOpen,        label: "Contabilidade",href: "accounting" },
  { icon: BarChart3,       label: "Relatórios",   href: "reports" },
];

const bottomItems = [
  { icon: RefreshCw, label: "Câmbio",        href: "settings/exchange-rates" },
  { icon: Settings,  label: "Configurações", href: "settings" },
];

export function Sidebar({ tenantId, collapsed = false }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === `/${tenantId}/${href}` ||
    (href !== "dashboard" && pathname.startsWith(`/${tenantId}/${href}`));

  const NavLink = ({ icon: Icon, label, href }: { icon: any; label: string; href: string }) => {
    const active = isActive(href);
    const link = (
      <Link
        href={`/${tenantId}/${href}`}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          "hover:bg-accent/50 hover:text-accent-foreground",
          active
            ? "bg-primary/10 text-primary border-r-2 border-primary"
            : "text-muted-foreground"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span className="truncate">{label}</span>}
        {!collapsed && active && <ChevronRight className="ml-auto h-3 w-3 opacity-50" />}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      );
    }
    return link;
  };

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-card transition-all duration-200",
        collapsed ? "w-14" : "w-56"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center border-b border-border px-3 py-4", collapsed ? "justify-center" : "gap-2")}>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold">
          S
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold tracking-tight text-foreground">STELLIUM</span>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="border-t border-border px-2 py-3 space-y-0.5">
        {bottomItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </div>
    </aside>
  );
}
