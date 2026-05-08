import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Link } from '@react-pdf/renderer';
import type { JournalEntry } from '@prisma/client';

// ─── Register Geist Mono Font for tabular numeric alignment ───
Font.register({
  family: 'GeistMono',
  fonts: [
    { src: '/fonts/GeistMono-Regular.ttf', format: 'truetype' },
  ]
});

// ─── Supabase Palette ────────────────────────────────
const colors = {
  racingGreen: '#3ecf8e',         /* Supabase Green */
  racingGreenLight: '#00c573',     /* Green Link */
  obsidian: '#171717',             /* Near Black */
  paper: '#fafafa',               /* Off White / Surface */
  error: '#3ecf8e',               /* Destructive (Supabase Green) */
};

// ─── Styles ────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: colors.paper,
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: colors.obsidian,
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: colors.racingGreen,
    paddingBottom: 16,
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  title: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 18,
    color: colors.racingGreen,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 8,
    color: colors.racingGreen,
    letterSpacing: 2,
    marginTop: 4,
  },
  period: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    color: colors.racingGreen,
  },
  divider: {
    borderBottomWidth: 0.5,
    borderBottomColor: colors.racingGreen,
    marginVertical: 12,
    opacity: 0.3,
  },
  table: {
    marginTop: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.racingGreen,
    paddingBottom: 6,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.25,
    borderBottomColor: colors.racingGreen,
    paddingVertical: 5,
    opacity: 0.7,
  },
  cellNumber: {
    width: '12%',
    fontFamily: 'GeistMono',
    fontSize: 8,
  },
  cellDate: {
    width: '12%',
    fontSize: 8,
  },
  cellDesc: {
    width: '30%',
    fontSize: 8,
  },
  cellRef: {
    width: '14%',
    fontSize: 7,
    opacity: 0.6,
  },
  cellStatus: {
    width: '10%',
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
  },
  cellDebit: {
    width: '16%',
    fontSize: 8,
    fontFamily: 'GeistMono',
    textAlign: 'right',
  },
  cellCredit: {
    width: '16%',
    fontSize: 8,
    fontFamily: 'GeistMono',
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 0.5,
    borderTopColor: colors.racingGreen,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: colors.racingGreen,
    opacity: 0.6,
  },
  statusBadge: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
  },
  totalsRow: {
    flexDirection: 'row',
    borderTopWidth: 1.5,
    borderTopColor: colors.racingGreen,
    paddingTop: 6,
    marginTop: 8,
  },
});

// ─── Helper: Format Currency ───────────────────────────────

const formatPYG = (amount: number | undefined): string => {
  if (!amount) return 'Gs. 0';
  return `Gs. ${Math.round(amount).toLocaleString('pt-BR')}`;
};

const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

// ─── Component: LedgerPDF ─────────────────────────────────

interface LedgerPDFProps {
  entries: JournalEntry[];
  period: string;
  language: 'pt' | 'es';
  tenantName?: string;
  tenantId?: string;
  userId?: string;
  checksum?: string;
}

export function LedgerPDF({ entries, period, language, tenantName, tenantId, userId, checksum }: LedgerPDFProps) {
  const t = (pt: string, es: string) => language === 'pt' ? pt : es;

  // Calculate totals
  const totalDebit = entries.reduce((acc, entry) => {
    const debit = entry.lines
      .filter(l => l.type === 'DEBIT')
      .reduce((sum, l) => sum + Number(l.amount), 0);
    return acc + debit;
  }, 0);

  const totalCredit = entries.reduce((acc, entry) => {
    const credit = entry.lines
      .filter(l => l.type === 'CREDIT')
      .reduce((sum, l) => sum + Number(l.amount), 0);
    return acc + credit;
  }, 0);

  return (
    <Document
      title={`AXIS Ledger - ${period}`}
      author={tenantName || 'AXIS ERP'}
      creator="AXIS ERP - Sovereign Accounting"
      producer="AXIS PDF Engine v1.0"
      keywords="ledger, accounting, AXIS, SIFEN"
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>
                {t('LIVRO RAZÃO', 'LIBRO MAYOR')}
              </Text>
              <Text style={styles.subtitle}>
                {t('Partidas Dobradas • Soberania Financeira', 'Partida Doble • Soberanía Financiera')}
              </Text>
              {tenantName && (
                <Text style={{ fontSize: 10, marginTop: 6, color: colors.racingGreenLight }}>
                  {tenantName}
                </Text>
              )}
            </View>
            <View>
              <Text style={styles.period}>{period}</Text>
              <Text style={{ fontSize: 7, textAlign: 'right', marginTop: 4, color: colors.racingGreen, opacity: 0.6 }}>
                {t('Período', 'Periodo')}
              </Text>
            </View>
          </View>
        </View>

        {/* Table Header */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.cellNumber}>#</Text>
            <Text style={styles.cellDate}>{t('Data', 'Fecha')}</Text>
            <Text style={styles.cellDesc}>{t('Descrição', 'Descripción')}</Text>
            <Text style={styles.cellRef}>{t('Referência', 'Referencia')}</Text>
            <Text style={styles.cellStatus}>{t('Status', 'Estado')}</Text>
            <Text style={styles.cellDebit}>{t('Débito (PYG)', 'Débito (PYG)')}</Text>
            <Text style={styles.cellCredit}>{t('Crédito (PYG)', 'Crédito (PYG)')}</Text>
          </View>

          {/* Table Rows */}
          {entries.map((entry, idx) => {
            const debitTotal = entry.lines
              .filter(l => l.type === 'DEBIT')
              .reduce((sum, l) => sum + Number(l.amount), 0);
            const creditTotal = entry.lines
              .filter(l => l.type === 'CREDIT')
              .reduce((sum, l) => sum + Number(l.amount), 0);

            return (
              <View key={entry.id || idx} style={styles.tableRow}>
                <Text style={styles.cellNumber}>{entry.number}</Text>
                <Text style={styles.cellDate}>{formatDate(entry.date)}</Text>
                <Text style={styles.cellDesc}>{entry.description}</Text>
                <Text style={styles.cellRef}>{entry.referenceType || '-'}</Text>
                <Text style={styles.cellStatus}>
                  <Text style={styles.statusBadge}>
                    {entry.status === 'POSTED' ? 'POSTED' : entry.status === 'DRAFT' ? 'DRAFT' : 'VOIDED'}
                  </Text>
                </Text>
                <Text style={[styles.cellDebit, { color: colors.racingGreen }]}>
                  {formatPYG(debitTotal)}
                </Text>
                <Text style={[styles.cellCredit, { color: colors.error }]}>
                  {formatPYG(creditTotal)}
                </Text>
              </View>
            );
          })}

          {/* Totals Row */}
          <View style={styles.totalsRow}>
            <Text style={[styles.cellNumber, { width: '66%' }]}>
              {t('TOTAIS', 'TOTALES')}
            </Text>
            <Text style={[styles.cellDebit, { color: colors.racingGreen }]}>
              {formatPYG(totalDebit)}
            </Text>
            <Text style={[styles.cellCredit, { color: colors.error }]}>
              {formatPYG(totalCredit)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>AXIS ERP • {t('Contabilidade & Financeiro', 'Contabilidad & Finanzas')}</Text>
          <Text>
            {t('Gerado em', 'Generado el')} {formatDate(new Date())}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export default LedgerPDF;
