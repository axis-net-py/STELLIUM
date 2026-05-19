'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { getTrendData } from '@/lib/dashboard';
import { formatCurrency, formatCurrencyCompact } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';

interface SalesChartProps {
  dateRange: { from: Date; to: Date };
  currency: 'PYG' | 'USD' | 'BRL';
}

function CustomTooltip({ active, payload, label, currency }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border p-3 shadow-sm text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="font-mono font-bold text-foreground">
        {formatCurrency(payload[0].value, currency)}
      </p>
    </div>
  );
}

export function SalesChart({ dateRange, currency }: SalesChartProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['trendData', dateRange, currency],
    queryFn: () => getTrendData({ start: dateRange.from, end: dateRange.to }),
  });

  if (isLoading) {
    return (
      <div className="bg-card border shadow-sm p-6">
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border shadow-sm p-6 text-destructive text-sm">
        Erro ao carregar grafico
      </div>
    );
  }

  const chartData = data || [];

  return (
    <div className="bg-card border shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Vendas — 30 dias
        </h3>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {currency}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradientGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(153, 100%, 13%)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="hsl(153, 100%, 13%)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />

          <XAxis
            dataKey="date"
            stroke="hsl(var(--muted-foreground))"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            interval="preserveStartEnd"
          />

          <YAxis
            stroke="hsl(var(--muted-foreground))"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(v) => formatCurrencyCompact(v, currency)}
            width={80}
          />

          <Tooltip
            content={<CustomTooltip currency={currency} />}
            cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1 }}
          />

          <Area
            type="monotone"
            dataKey="total"
            stroke="hsl(153, 100%, 13%)"
            strokeWidth={2}
            fill="url(#gradientGreen)"
            dot={false}
            activeDot={{ r: 4, stroke: 'hsl(153, 100%, 13%)', strokeWidth: 2, fill: 'hsl(var(--background))' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
