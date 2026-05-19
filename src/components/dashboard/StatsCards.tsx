'use client';

import { Geist_Mono } from 'next/font/google';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '@/lib/dashboard';
import { formatCurrency } from '@/lib/format';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const geistMono = Geist_Mono({ subsets: ['latin'] });

interface StatsCardsProps {
  dateRange: { from: Date; to: Date };
  currency: 'PYG' | 'USD' | 'BRL';
}

export function StatsCards({ dateRange, currency }: StatsCardsProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboardStats', dateRange, currency],
    queryFn: () => getDashboardStats({ start: dateRange.from, end: dateRange.to }),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-destructive text-sm">Erro ao carregar estatisticas</div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="border-l-4 border-l-[hsl(var(--primary))] shadow-sm bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Vendas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <h3 className={`${geistMono.className} text-2xl font-bold text-foreground`}>
              {formatCurrency(Number(data.salesTotal), currency)}
            </h3>
            <span className="text-[10px] text-green-600">+{data.salesCount} trans</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-[hsl(var(--primary))] shadow-sm bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Compras
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <h3 className={`${geistMono.className} text-2xl font-bold text-foreground`}>
              {formatCurrency(Number(data.purchasesTotal), currency)}
            </h3>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-[hsl(var(--accent))] shadow-sm bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Estoque Baixo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <h3 className={`${geistMono.className} text-2xl font-bold text-foreground`}>
              {data.lowStockAlerts}
            </h3>
            <span className="text-[10px] text-amber-600">produtos</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-[hsl(var(--primary))] shadow-sm bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Liquidez
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <h3 className={`${geistMono.className} text-2xl font-bold text-foreground`}>
              {formatCurrency(Number(data.liquidity), currency)}
            </h3>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function StatCardSkeleton() {
  return <Skeleton className="h-32 w-full" />;
}
