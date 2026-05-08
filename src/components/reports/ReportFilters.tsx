'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

export function ReportFilters() {
  const t = useTranslations('reports.filters');

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Date Range - Simple inputs */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              className="h-9 px-3 rounded-md border border-input bg-transparent text-xs"
              defaultValue={new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]}
            />
            <span className="text-muted-foreground text-xs">to</span>
            <input
              type="date"
              className="h-9 px-3 rounded-md border border-input bg-transparent text-xs"
              defaultValue={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Report Type */}
          <Select defaultValue="sales">
            <SelectTrigger className="w-[180px] text-xs">
              <SelectValue placeholder={t('type')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sales">{t('type')} - Sales</SelectItem>
              <SelectItem value="purchases">Purchases</SelectItem>
              <SelectItem value="inventory">Inventory</SelectItem>
            </SelectContent>
          </Select>

          {/* Export Button */}
          <Button className="ml-auto bg-[hsl(var(--primary))] text-primary-foreground hover:bg-[hsl(var(--primary))]/90">
            {t('exportPDF')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
