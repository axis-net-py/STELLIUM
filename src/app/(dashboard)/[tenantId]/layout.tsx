import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardShell } from "@/components/DashboardShell";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenantId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const { tenantId } = await params;

  // Ensure user belongs to this tenant
  if (session.user.tenantId !== tenantId) {
    redirect(`/${session.user.tenantId}/dashboard`);
  }

  return <DashboardShell tenantId={tenantId}>{children}</DashboardShell>;
}
