'use client';

import { useTranslations } from 'next-intl';
import { Geist_Mono } from 'next/font/google';
import { Skeleton } from '@/components/ui/skeleton';

const geistMono = Geist_Mono({ subsets: ['latin'] });

// Mock data - replace with actual data fetching
const mockData = [
  { id: 1, date: '2026-05-01', total: 1500000, currency: 'PYG' },
  { id: 2, date: '2026-05-02', total: 2300000, currency: 'PYG' },
  { id: 3, date: '2026-05-03', total: 900000, currency: 'PYG' },
];

export function ReportTable() {
  const t = useTranslations('reports.table');

  return (
    <div className="bg-card border shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left p-3 text-xs uppercase tracking-wider text-muted-foreground">
                {t('date')}
              </th>
              <th className="text-right p-3 text-xs uppercase tracking-wider text-muted-foreground">
                {t('total')}
              </th>
            </tr>
          </thead>
          <tbody>
            {mockData.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border/50 hover:bg-muted/20 transition-colors"
              >
                <td className="p-3 text-foreground">{row.date}</td>
                <td className={`p-3 text-right ${geistMono.className} text-foreground`}>
                  {row.total.toLocaleString('es-PY')} PYG
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
