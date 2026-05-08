'use client';

import { useTranslations } from 'next-intl';
import { Geist_Mono } from 'next/font/google';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '@axis/dashboard';
import { formatCurrency } from '@axis/currency';
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
  const t = useTranslations('dashboard');

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboardStats', dateRange, currency],
    queryFn: () => getDashboardStats(dateRange),
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

  if (error) {
    return (
      <div className="text-destructive text-sm">
        {t('errorLoadingStats')}
      </div>
    );
  }

  const stats = data!;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Sales Card */}
      <Card className="border-l-4 border-l-[hsl(var(--primary))] shadow-sm bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {t('sales')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <h3
              className={`${geistMono.className} text-2xl font-bold text-[hsl(var(--foreground))]`}
            >
              {formatCurrency(stats.sales.total, currency)}
            </h3>
            <span className="text-[10px] text-green-600">+{stats.sales.count} trans</span>
          </div>
        </CardContent>
      </Card>

      {/* Purchases Card */}
      <Card className="border-l-4 border-l-[hsl(var(--primary))] shadow-sm bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {t('purchases')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <h3
              className={`${geistMono.className} text-2xl font-bold text-[hsl(var(--foreground))]`}
            >
              {formatCurrency(stats.purchases.total, currency)}
            </h3>
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Alerts */}
      <Card className="border-l-4 border-l-[hsl(var(--accent))] shadow-sm bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {t('lowStockAlerts')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <h3
              className={`${geistMono.className} text-2xl font-bold text-[hsl(var(--foreground))]`}
            >
              {stats.lowStockAlerts}
            </h3>
            <span className="text-[10px] text-amber-600">
              {t('products')}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Liquidity */}
      <Card className="border-l-4 border-l-[hsl(var(--primary))] shadow-sm bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {t('liquidity')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <h3
              className={`${geistMono.className} text-2xl font-bold text-[hsl(var(--foreground))]`}
            >
              {formatCurrency(stats.liquidity, currency)}
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
