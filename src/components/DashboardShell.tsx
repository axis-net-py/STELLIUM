"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

interface DashboardShellProps {
  tenantId: string;
  children: React.ReactNode;
}

export function DashboardShell({ tenantId, children }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar tenantId={tenantId} collapsed={collapsed} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header tenantId={tenantId} onToggleSidebar={() => setCollapsed((c) => !c)} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
