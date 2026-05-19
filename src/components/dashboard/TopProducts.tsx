'use client';

import { Geist_Mono } from 'next/font/google';
import { useQuery } from '@tanstack/react-query';
import { getTopProducts } from '@/lib/dashboard';
import { formatCurrency } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';

const geistMono = Geist_Mono({ subsets: ['latin'] });

interface TopProductsProps {
  dateRange: { from: Date; to: Date };
  currency: 'PYG' | 'USD' | 'BRL';
  limit?: number;
}

export function TopProducts({ dateRange, currency, limit = 5 }: TopProductsProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['topProducts', dateRange, currency, limit],
    queryFn: () => getTopProducts({ start: dateRange.from, end: dateRange.to }, limit),
  });

  if (isLoading) {
    return (
      <div className="bg-card border shadow-sm p-6 space-y-4">
        <Skeleton className="h-4 w-32" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border shadow-sm p-6 text-destructive text-sm">
        Erro ao carregar produtos
      </div>
    );
  }

  const products = data || [];

  return (
    <div className="bg-card border shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Produtos — Top {limit}
        </h3>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {currency}
        </span>
      </div>

      <div className="space-y-1">
        <div className="grid grid-cols-12 gap-2 pb-2 border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
          <div className="col-span-1">#</div>
          <div className="col-span-5">Produto</div>
          <div className="col-span-2 text-right">Qtd</div>
          <div className="col-span-4 text-right">Receita</div>
        </div>

        {products.map((product, index) => (
          <div
            key={product.name}
            className="grid grid-cols-12 gap-2 py-2 border-b border-border/50 text-sm hover:bg-muted/30 transition-colors"
          >
            <div className="col-span-1 text-muted-foreground">{index + 1}</div>
            <div className="col-span-5 font-medium text-foreground truncate">{product.name}</div>
            <div className={`col-span-2 text-right ${geistMono.className} text-foreground`}>
              {product.quantity.toLocaleString()}
            </div>
            <div className={`col-span-4 text-right ${geistMono.className} font-medium text-foreground`}>
              {formatCurrency(product.revenue, currency)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
