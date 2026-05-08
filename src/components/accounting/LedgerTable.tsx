"use client";

import React, { useState, useMemo } from 'react';
import { getJournalEntries, getLedgerEntries, getLedgerEntriesWithShadow, getTrialBalance, postInvoiceToLedger, voidJournalEntry } from '@/app/actions/accounting';
import { getAccounts } from '@/app/actions/accounting';
import { useLanguage } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { Loader2, FileText, Scale, Ban, Eye, CalendarIcon, Download, Filter, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR, es } from 'date-fns/locale';
import { Decimal } from '@prisma/client/runtime/library';
import { pdf } from '@react-pdf/renderer';
import LedgerPDF from '@/components/accounting/LedgerPDF';

// ─── Types ──────────────────────────────────────────────────────

interface JournalEntry {
  id: string;
  tenantId: string;
  number: string;
  date: Date;
  description: string;
  referenceType: string | null;
  referenceId: string | null;
  status: 'DRAFT' | 'POSTED' | 'VOIDED';
  postedAt: Date | null;
  createdBy: string;
  lines: JournalLine[];
}

interface JournalLine {
  id: string;
  tenantId: string;
  journalEntryId: string;
  accountId: string;
  type: 'DEBIT' | 'CREDIT';
  amount: Decimal;
  currency: string;
  exchangeRate: Decimal;
  amountUSD: Decimal;
  account: {
    id: string;
    code: string;
    namePt: string;
    nameEs: string;
    type: string;
  };
}

// ─── Main Component ─────────────────────────────────────────────

export default function LedgerTable({ tenantId }: { tenantId: string }) {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [showShadow, setShowShadow] = useState(false);

  const locale = language === 'pt' ? ptBR : es;

  // Load journal entries
  const loadEntries = async () => {
    setLoading(true);
    try {
      const filters = {
        ...(statusFilter !== 'all' && { status: statusFilter as any }),
        ...(startDate && endDate && { startDate, endDate }),
      };

      const data = showShadow
        ? await getLedgerEntriesWithShadow(filters)
        : await getJournalEntries(filters);

      setEntries(data as any);
      setFilteredEntries(data as any);
    } catch (error) {
      toast.error('Failed to load journal entries');
    } finally {
      setLoading(false);
    }
  };

  // Generate and download PDF
  const handlePDFExport = async () => {
    try {
      setLoading(true);
      const filters = {
        ...(statusFilter !== 'all' && { status: statusFilter as any }),
        ...(startDate && endDate && { startDate, endDate }),
      };

      const data = await getJournalEntries(filters) as any[];
      const period = startDate && endDate
        ? `${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`
        : 'All Periods';

      const blob = await pdf(
        <LedgerPDF
          entries={data}
          period={period}
          language={language}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ledger-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('PDF downloaded successfully');
    } catch (error: any) {
      toast.error('Failed to generate PDF: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useMemo(() => {
    let filtered = [...entries];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(e => e.status === statusFilter);
    }

    if (startDate && endDate) {
      filtered = filtered.filter(e => {
        const d = new Date(e.date);
        return d >= startDate && d <= endDate;
      });
    }

    setFilteredEntries(filtered);
  }, [entries, statusFilter, startDate, endDate]);

  // Handle post invoice to ledger
  const handlePostInvoice = async (invoiceId: string) => {
    try {
      const result = await postInvoiceToLedger(invoiceId);
      if (result.success) {
        toast.success('Invoice posted to ledger successfully');
        loadEntries();
      } else {
        toast.error(result.error || 'Failed to post invoice');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to post invoice');
    }
  };

  // Handle void entry
  const handleVoidEntry = async (entryId: string) => {
    try {
      const result = await voidJournalEntry(entryId, 'Correction');
      if (result.success) {
        toast.success('Journal entry voided successfully');
        loadEntries();
      } else {
        toast.error(result.error || 'Failed to void entry');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to void entry');
    }
  };

  // Status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'POSTED':
        return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-none border-0 font-mono text-[11px]">POSTED</Badge>;
      case 'DRAFT':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-none border-0 font-mono text-[11px]">DRAFT</Badge>;
      case 'VOIDED':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-none border-0 font-mono text-[11px]">VOIDED</Badge>;
      default:
        return <Badge className="rounded-none border-0 font-mono text-[11px]">{status}</Badge>;
    }
  };

  // Format currency for PYG (no decimals)
  const formatPYG = (amount: Decimal | number) => {
    const num = typeof amount === 'number' ? amount : Number(amount);
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'PYG', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
  };

  // Format currency for USD
  const formatUSD = (amount: Decimal | number) => {
    const num = typeof amount === 'number' ? amount : Number(amount);
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <Card className="rounded-none border border-foreground/10 bg-white/40 dark:bg-white/5 backdrop-blur-xl">
        <CardContent className="p-4 flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-2">
            <Label className="text-[10px] uppercase tracking-wider text-foreground/40 font-bold">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] rounded-none border-foreground/20 font-mono text-[12px] h-9">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="all" className="font-mono text-[12px]">All Status</SelectItem>
                <SelectItem value="DRAFT" className="font-mono text-[12px]">DRAFT</SelectItem>
                <SelectItem value="POSTED" className="font-mono text-[12px]">POSTED</SelectItem>
                <SelectItem value="VOIDED" className="font-mono text-[12px]">VOIDED</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-[10px] uppercase tracking-wider text-foreground/40 font-bold">Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[160px] rounded-none border-foreground/20 font-mono text-[12px] h-9 justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'PPP', { locale }) : 'Pick date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-none" align="start">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-[10px] uppercase tracking-wider text-foreground/40 font-bold">End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[160px] rounded-none border-foreground/20 font-mono text-[12px] h-9 justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'PPP', { locale }) : 'Pick date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-none" align="start">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <Button onClick={loadEntries} disabled={loading} className="rounded-none bg-primary text-primary-foreground h-9 px-6 font-bold text-[12px]">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
            {t('common.filter')}
          </Button>

          <Button
            variant={showShadow ? "default" : "outline"}
            className="rounded-none border-foreground/20 h-9 px-6 font-bold text-[12px]"
            onClick={() => { setShowShadow(!showShadow); setTimeout(() => loadEntries(), 0); }}
          >
            <ArrowUpDown className="w-4 h-4 mr-2" />
            {language === 'pt' ? 'Shadow USD' : 'Sombra USD'}
          </Button>

          <Button variant="outline" className="rounded-none border-foreground/20 h-9 px-6 font-bold text-[12px] ml-auto" onClick={handlePDFExport} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            PDF
          </Button>
        </CardContent>
      </Card>

      {/* Journal Entries Table */}
      <Card className="rounded-none border border-foreground/10 bg-white/40 dark:bg-white/5 backdrop-blur-xl">
        <CardHeader className="border-b border-foreground/5 pb-4">
          <CardTitle className="text-[14px] font-bold text-foreground/80 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Journal Entries / Lançamentos de Diário
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[#1e1e1e] hover:bg-transparent">
                <TableHead className="text-[10px] uppercase tracking-wider text-foreground/40 font-bold rounded-none">Number</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-foreground/40 font-bold rounded-none">Date</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-foreground/40 font-bold rounded-none">Description</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-foreground/40 font-bold rounded-none">Reference</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-foreground/40 font-bold rounded-none">Status</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-foreground/40 font-bold rounded-none text-right">Debit (PYG)</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-foreground/40 font-bold rounded-none text-right">Credit (PYG)</TableHead>
                {showShadow && (
                  <>
                    <TableHead className="text-[10px] uppercase tracking-wider text-foreground/40 font-bold rounded-none text-right">Debit (USD)</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-foreground/40 font-bold rounded-none text-right">Credit (USD)</TableHead>
                  </>
                )}
                <TableHead className="text-[10px] uppercase tracking-wider text-foreground/40 font-bold rounded-none text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={showShadow ? 10 : 8} className="text-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                    <span className="text-[11px] text-foreground/40 font-bold uppercase tracking-widest">Loading...</span>
                  </TableCell>
                </TableRow>
              ) : filteredEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showShadow ? 10 : 8} className="text-center py-20">
                    <span className="text-[11px] text-foreground/30 font-bold uppercase tracking-widest">No entries found</span>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntries.map((entry) => {
                  const debitTotal = entry.lines
                    .filter(l => l.type === 'DEBIT')
                    .reduce((acc, l) => acc + Number(l.amount), 0);
                  const creditTotal = entry.lines
                    .filter(l => l.type === 'CREDIT')
                    .reduce((acc, l) => acc + Number(l.amount), 0);

                  // Shadow Accounting: calculate USD totals using historical exchange rate
                  const debitTotalUSD = showShadow ? entry.lines
                    .filter(l => l.type === 'DEBIT')
                    .reduce((acc, l) => acc + Number(l.amountUSD || 0), 0) : 0;
                  const creditTotalUSD = showShadow ? entry.lines
                    .filter(l => l.type === 'CREDIT')
                    .reduce((acc, l) => acc + Number(l.amountUSD || 0), 0) : 0;

                  return (
                    <TableRow key={entry.id} className="border-b border-[#1e1e1e] hover:bg-foreground/[0.02] transition-colors">
                      <TableCell className="font-mono text-[12px] font-bold text-foreground/70">{entry.number}</TableCell>
                      <TableCell className="font-mono text-[12px] text-foreground/60">
                        {format(new Date(entry.date), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="text-[12px] text-foreground/70 max-w-[300px] truncate">{entry.description}</TableCell>
                      <TableCell className="text-[11px] text-foreground/40 font-mono">{entry.referenceType || '-'}</TableCell>
                      <TableCell>{getStatusBadge(entry.status)}</TableCell>
                      <TableCell className="text-right font-mono font-medium text-[12px] text-emerald-600 dark:text-emerald-400">
                        {formatPYG(debitTotal)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium text-[12px] text-red-600 dark:text-red-400">
                        {formatPYG(creditTotal)}
                      </TableCell>
                      {showShadow && (
                        <>
                          <TableCell className="text-right font-mono font-medium text-[12px] text-emerald-600/70">
                            {formatUSD(debitTotalUSD)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium text-[12px] text-red-600/70">
                            {formatUSD(creditTotalUSD)}
                          </TableCell>
                        </>
                      )}
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-none h-7 w-7 p-0"
                            onClick={() => { setSelectedEntry(entry); setShowEntryDialog(true); }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {entry.status === 'POSTED' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-none h-7 w-7 p-0 text-red-500 hover:text-red-700"
                              onClick={() => handleVoidEntry(entry.id)}
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Entry Detail Dialog */}
      <Dialog open={showEntryDialog} onOpenChange={setShowEntryDialog}>
        <DialogContent className="rounded-none max-w-[900px] bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-foreground/10">
          <DialogHeader>
            <DialogTitle className="text-[14px] font-bold text-foreground/80 font-mono">
              {selectedEntry?.number} - Entry Details / Detalhes do Lançamento
            </DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-[12px]">
                <div>
                  <span className="text-foreground/40 uppercase tracking-wider text-[10px] font-bold">Date</span>
                  <p className="font-mono font-bold text-foreground/70 mt-1">
                    {format(new Date(selectedEntry.date), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
                <div>
                  <span className="text-foreground/40 uppercase tracking-wider text-[10px] font-bold">Status</span>
                  <div className="mt-1">{getStatusBadge(selectedEntry.status)}</div>
                </div>
                <div className="col-span-2">
                  <span className="text-foreground/40 uppercase tracking-wider text-[10px] font-bold">Description</span>
                  <p className="font-mono text-foreground/70 mt-1">{selectedEntry.description}</p>
                </div>
              </div>

              {/* Journal Lines */}
              <Table>
                <TableHeader>
                  <TableRow className="border-foreground/5">
                    <TableHead className="text-[10px] uppercase tracking-wider text-foreground/40 font-bold rounded-none">Account Code</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-foreground/40 font-bold rounded-none">Account Name</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-foreground/40 font-bold rounded-none">Type</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-foreground/40 font-bold rounded-none text-right">Amount (PYG)</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-foreground/40 font-bold rounded-none text-right">Amount (USD)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedEntry.lines.map((line) => (
                    <TableRow key={line.id} className="border-foreground/5">
                      <TableCell className="font-mono text-[12px] font-bold text-foreground/70">{line.account.code}</TableCell>
                      <TableCell className="text-[12px] text-foreground/70">
                        {language === 'pt' ? line.account.namePt : line.account.nameEs}
                      </TableCell>
                      <TableCell>
                        <Badge className={`rounded-none border-0 font-mono text-[11px] ${
                          line.type === 'DEBIT'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {line.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-[12px] font-bold text-foreground/70">
                        {formatPYG(line.amount)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-[12px] text-foreground/40">
                        {line.amountUSD ? formatUSD(line.amountUSD) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
