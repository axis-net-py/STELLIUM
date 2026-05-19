import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function getDashboardStats(dateRange?: { start?: Date; end?: Date }) {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error("Tenant nao encontrado");
  const tenantId = session.user.tenantId;

  const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = dateRange?.end || new Date();

  const [sales, purchases, lowStock, liquidity] = await Promise.all([
    prisma.commercialInvoice.aggregate({
      where: { tenantId, type: "SALES", status: "APPROVED", issuedAt: { gte: startDate, lte: endDate } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.commercialInvoice.aggregate({
      where: { tenantId, type: "PURCHASE", status: "APPROVED", issuedAt: { gte: startDate, lte: endDate } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)::bigint as count FROM "Product"
      WHERE "tenantId" = ${tenantId} AND "isActive" = true AND "currentStock" <= "minStock"
    `.then((r) => Number(r[0]?.count ?? 0)),
    prisma.commercialInvoice.aggregate({
      where: { tenantId, type: "SALES", status: "APPROVED" },
      _sum: { totalAmount: true },
    }),
  ]);

  return {
    salesTotal: sales._sum.totalAmount || 0,
    salesCount: sales._count || 0,
    purchasesTotal: purchases._sum.totalAmount || 0,
    purchasesCount: purchases._count || 0,
    lowStockAlerts: lowStock,
    liquidity: liquidity._sum.totalAmount || 0,
  };
}

export async function getTrendData(dateRange?: { start?: Date; end?: Date }) {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error("Tenant nao encontrado");
  const tenantId = session.user.tenantId;

  const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = dateRange?.end || new Date();

  const invoices = await prisma.commercialInvoice.findMany({
    where: { tenantId, status: "APPROVED", issuedAt: { gte: startDate, lte: endDate } },
    orderBy: { issuedAt: "asc" },
    select: { issuedAt: true, totalAmount: true },
  });

  const grouped: Record<string, number> = {};
  for (const inv of invoices) {
    const date = inv.issuedAt.toISOString().split("T")[0];
    grouped[date] = (grouped[date] || 0) + Number(inv.totalAmount);
  }

  return Object.entries(grouped).map(([date, total]) => ({ date, total }));
}

export async function getTopProducts(dateRange?: { start?: Date; end?: Date }, limit = 5) {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error("Tenant nao encontrado");
  const tenantId = session.user.tenantId;

  const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = dateRange?.end || new Date();

  const items = await prisma.invoiceItem.findMany({
    where: {
      commercialInvoice: { tenantId, status: "APPROVED", issuedAt: { gte: startDate, lte: endDate } },
    },
    include: { product: true },
  });

  const grouped: Record<string, { name: string; quantity: number; revenue: number }> = {};
  for (const item of items) {
    if (!item.product) continue;
    const existing = grouped[item.product.id] || { name: item.product.namePt, quantity: 0, revenue: 0 };
    existing.quantity += Number(item.quantity);
    existing.revenue += Number(item.totalPrice);
    grouped[item.product.id] = existing;
  }

  return Object.values(grouped)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}
