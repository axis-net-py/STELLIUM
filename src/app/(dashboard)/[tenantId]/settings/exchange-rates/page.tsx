import { getTranslations } from "next-intl/server";
import prisma from "@/lib/prisma";
import { GeistMono } from "geist/font/mono";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es, pt } from "date-fns/locale";

interface ExchangeRatesPageProps {
  params: Promise<{ tenantId: string }>;
  searchParams: Promise<{ locale?: string }>;
}

export default async function ExchangeRatesPage({
  params,
  searchParams,
}: ExchangeRatesPageProps) {
  const { tenantId } = await params;
  const { locale = "pt-BR" } = await searchParams;
  const t = await getTranslations({ locale, namespace: "exchangeRates" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  // Fetch recent exchange rates
  const rates = await prisma.exchangeRate.findMany({
    where: { tenantId },
    orderBy: { date: "desc" },
    take: 30,
  });

  // Get latest rate for display
  const latestRate = rates[0];
  const previousRate = rates[1];

  // Pre-compute percentage changes
  const getPercentageChange = (current: number, prev: number): string | null => {
    if (prev === 0) return null;
    return (((current - prev) / prev) * 100).toFixed(2);
  };

  const usdChange = previousRate
    ? getPercentageChange(Number(latestRate.ratePYGtoUSD), Number(previousRate.ratePYGtoUSD))
    : null;
  const brlChange = previousRate
    ? getPercentageChange(Number(latestRate.ratePYGtoBRL), Number(previousRate.ratePYGtoBRL))
    : null;

  const dateLocale = locale === "es-PY" ? es : pt;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("description")}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/${tenantId}/settings`}>
            <Button variant="outline" size="sm">
              {tCommon("back")}
            </Button>
          </Link>
          <form action={`/api/exchange-rates/fetch?tenantId=${tenantId}`} method="POST">
            <Button
              type="submit"
              className="axis-btn-gold"
            >
              {t("fetchOfficial")}
            </Button>
          </form>
        </div>
      </div>

      {/* Current Rates Card */}
      {latestRate && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="axis-glass-panel old-money-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                PYG → USD
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold tabular-nums ${GeistMono.className}`}>
                {Number(latestRate.ratePYGtoUSD).toFixed(4)}
              </div>
              {previousRate && usdChange !== null && (
                <Badge
                  variant="outline"
                  className={`mt-2 ${
                    Number(latestRate.ratePYGtoUSD) > Number(previousRate.ratePYGtoUSD)
                      ? "exchange-rate-positive"
                      : "exchange-rate-negative"
                  }`}
                >
                  {Number(latestRate.ratePYGtoUSD) > Number(previousRate.ratePYGtoUSD) ? "+" : ""}
                  {usdChange}%
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card className="axis-glass-panel old-money-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                PYG → BRL
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold tabular-nums ${GeistMono.className}`}>
                {Number(latestRate.ratePYGtoBRL).toFixed(4)}
              </div>
              {previousRate && brlChange !== null && (
                <Badge
                  variant="outline"
                  className={`mt-2 ${
                    Number(latestRate.ratePYGtoBRL) > Number(previousRate.ratePYGtoBRL)
                      ? "exchange-rate-positive"
                      : "exchange-rate-negative"
                  }`}
                >
                  {Number(latestRate.ratePYGtoBRL) > Number(previousRate.ratePYGtoBRL) ? "+" : ""}
                  {brlChange}%
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card className="axis-glass-panel old-money-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("lastUpdate")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-lg font-semibold tabular-nums ${GeistMono.className}`}>
                {format(new Date(latestRate.date), "dd/MM/yyyy HH:mm", {
                  locale: dateLocale,
                })}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {latestRate.isManual ? t("isManual") : t("source")}: {latestRate.source}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Exchange Rates Table */}
      <Card className="axis-glass-panel">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-b border-foreground/10">
                <TableHead className={`font-mono text-muted-foreground ${GeistMono.className}`}>
                  {t("table.date")}
                </TableHead>
                <TableHead className={`text-right font-mono ${GeistMono.className}`}>
                  {t("table.rateUSD")}
                </TableHead>
                <TableHead className={`text-right font-mono ${GeistMono.className}`}>
                  {t("table.rateBRL")}
                </TableHead>
                <TableHead className={`font-mono text-muted-foreground ${GeistMono.className}`}>
                  {t("table.source")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    {t("noRates") || "No exchange rates found"}
                  </TableCell>
                </TableRow>
              ) : (
                rates.map((rate: any) => (
                  <TableRow
                    key={rate.id}
                    className="border-b border-foreground/5 hover:bg-foreground/5 transition-colors"
                  >
                    <TableCell className={`font-mono tabular-nums ${GeistMono.className}`}>
                      {format(new Date(rate.date), "dd/MM/yyyy", { locale: dateLocale })}
                    </TableCell>
                    <TableCell className={`text-right font-mono tabular-nums ${GeistMono.className}`}>
                      {Number(rate.ratePYGtoUSD).toFixed(4)}
                    </TableCell>
                    <TableCell className={`text-right font-mono tabular-nums ${GeistMono.className}`}>
                      {Number(rate.ratePYGtoBRL).toFixed(4)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <Badge variant={rate.isManual ? "secondary" : "default"}>
                        {rate.isManual ? t("isManual") : rate.source}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
