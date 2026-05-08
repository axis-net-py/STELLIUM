import { Suspense } from 'react';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { ReportTable } from '@/components/reports/ReportTable';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function ReportsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold uppercase tracking-widest text-foreground">
          Reports
        </h1>
      </div>

      <Suspense fallback={<Skeleton className="h-20 w-full" />}>
        <ReportFilters />
      </Suspense>

      <Suspense
        fallback={
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-[400px] w-full" />
            </CardContent>
          </Card>
        }
      >
        <ReportTable />
      </Suspense>
    </div>
  );
}
