import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer';
import QRCode from 'qrcode';

// ─── Register Geist Mono Font ─────────────────────────────
Font.register({
  family: 'GeistMono',
  fonts: [
    { src: '/fonts/GeistMono-Regular.ttf', format: 'truetype' },
  ],
});

// ─── Supabase Palette ────────────────────────────────
const colors = {
  racingGreen: '#3ecf8e',         /* Supabase Green */
  racingGreenLight: '#00c573',     /* Green Link */
  obsidian: '#171717',             /* Near Black */
  paper: '#fafafa',               /* Off White / Surface */
  error: '#3ecf8e',               /* Destructive (Supabase Green) */
};

// ─── Styles ────────────────────────────────────────────
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
    alignItems: 'flex-start',
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
  invoiceNumber: {
    fontFamily: 'GeistMono',
    fontSize: 12,
    color: colors.racingGreen,
  },
  date: {
    fontSize: 8,
    color: colors.racingGreen,
    opacity: 0.6,
    textAlign: 'right',
    marginTop: 4,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: colors.racingGreen,
    marginBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.racingGreen,
    paddingBottom: 4,
  },
  // SIFEN specific
  sifenSection: {
    backgroundColor: 'rgba(62, 207, 142, 0.1)',
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.racingGreen,
  },
  cdcLabel: {
    fontSize: 7,
    color: colors.racingGreen,
    opacity: 0.7,
    marginBottom: 4,
  },
  cdcValue: {
    fontFamily: 'GeistMono',
    fontSize: 10,
    color: colors.obsidian,
    letterSpacing: 1,
  },
  qrContainer: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  qrLabel: {
    fontSize: 7,
    color: colors.racingGreen,
    opacity: 0.7,
    marginTop: 8,
    marginBottom: 4,
  },
  // Table
  table: {
    marginTop: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.racingGreen,
    paddingBottom: 6,
    marginBottom: 4,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.25,
    borderBottomColor: colors.racingGreen,
    paddingVertical: 5,
    fontSize: 8,
  },
  colProduct: { width: '40%' },
  colSku: { width: '15%', fontFamily: 'GeistMono', fontSize: 7 },
  colQty: { width: '15%', fontFamily: 'GeistMono', textAlign: 'right' },
  colPrice: { width: '15%', fontFamily: 'GeistMono', textAlign: 'right' },
  colTotal: { width: '15%', fontFamily: 'GeistMono', textAlign: 'right' },
  // Totals
  totalsSection: {
    marginTop: 20,
    borderTopWidth: 1.5,
    borderTopColor: colors.racingGreen,
    paddingTop: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: colors.racingGreen,
  },
  totalValue: {
    fontFamily: 'GeistMono',
    fontSize: 10,
    color: colors.racingGreen,
  },
  // Footer
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
});

// ─── Helper: Format Currency ───────────────────────────────
const formatPYG = (amount: number | undefined): string => {
  if (!amount) return 'Gs. 0';
  return `Gs. ${Math.round(amount).toLocaleString('pt-BR')}`;
};

const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, '0')}/${String(
    d.getMonth() + 1
  ).padStart(2, '0')}/${d.getFullYear()}`;
};

// ─── Helper: Generate QR Code Data URL ─────────────────────
const generateQRCode = (text: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    QRCode.toDataURL(
      text,
      {
        margin: 2, // 5mm quiet zone equivalent
        width: 120,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      },
      (err: Error | null, url: string) => {
        if (err) reject(err);
        else resolve(url);
      }
    );
  });
};

// ─── Types ────────────────────────────────────────────────
interface InvoiceItem {
  product: {
    namePt: string;
    nameEs: string;
    sku: string;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface SifenInvoiceData {
  id: string;
  number?: string;
  documentNumber?: string;
  sifenCdc?: string | null;
  sifenXmlUrl?: string | null;
  issuedAt: Date | string;
  type: 'PURCHASE' | 'SALE';
  status: string;
  customer: {
    name: string;
    document?: string | null;
  };
  items: InvoiceItem[];
  totalAmount: number;
  exchangeRate?: number;
  totalUSD?: number;
}

interface SifenInvoicePDFProps {
  invoice: SifenInvoiceData;
  language: 'pt' | 'es';
  tenantId?: string;
  userId?: string;
  checksum?: string;
}

// ─── Component: SifenInvoicePDF ─────────────────────────
export function SifenInvoicePDF({
  invoice,
  language,
  tenantId,
  userId,
  checksum,
}: SifenInvoicePDFProps) {
  const t = (pt: string, es: string) => (language === 'pt' ? pt : es);

  const isPurchase = invoice.type === 'PURCHASE';

  // Generate QR code data from CDC
  const qrData = invoice.sifenCdc || invoice.documentNumber || invoice.id;

  return (
    <Document
      title={`SIFEN Invoice ${invoice.documentNumber || invoice.number || invoice.id}`}
      author={tenantId || 'AXIS ERP'}
      creator="AXIS ERP - Sovereign Accounting"
      producer="AXIS PDF Engine v1.0"
      keywords={`SIFEN, invoice, AXIS, ${invoice.sifenCdc || ''}`}
    >
      <Page size="A4" style={styles.page}>
        {/* Header with 2pt British Racing Green border */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>AXIS ERP</Text>
              <Text style={styles.subtitle}>
                {isPurchase
                  ? t('Fatura de Compra', 'Factura de Compra')
                  : t('Fatura de Venda', 'Factura de Venta')}
              </Text>
              {tenantId && (
                <Text
                  style={{
                    fontSize: 8,
                    marginTop: 6,
                    color: colors.racingGreenLight,
                  }}
                >
                  Tenant: {tenantId}
                </Text>
              )}
            </View>
            <View>
              <Text style={styles.invoiceNumber}>
                #{invoice.id.slice(-8).toUpperCase()}
              </Text>
              <Text style={styles.date}>
                {formatDate(invoice.issuedAt)}
              </Text>
              <Text
                style={{
                  textAlign: 'right',
                  fontSize: 7,
                  marginTop: 4,
                  color: colors.racingGreen,
                  opacity: 0.6,
                }}
              >
                {t('Período', 'Periodo')}
              </Text>
            </View>
          </View>
        </View>

        {/* SIFEN Status Section */}
        <View style={styles.sifenSection}>
          <Text
            style={[
              styles.statusBadge,
              {
                color:
                  invoice.status === 'APPROVED'
                    ? colors.racingGreen
                    : invoice.status === 'PENDING'
                    ? '#898989'
                    : colors.error,
              },
            ]}
          >
            SIFEN:{' '}
            {invoice.status === 'APPROVED'
              ? '✓ APPROVED'
              : invoice.status === 'PENDING'
              ? '⏳ PENDING'
              : invoice.status}
          </Text>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isPurchase
              ? t('Fornecedor', 'Proveedor')
              : t('Cliente', 'Cliente')}
          </Text>
          <Text>{invoice.customer.name}</Text>
          {invoice.customer.document && (
            <Text style={{ fontSize: 8, color: '#898989' }}>
              Doc: {invoice.customer.document}
            </Text>
          )}
        </View>

        {/* CDC Display (Mono Font) */}
        {invoice.sifenCdc && (
          <View style={styles.sifenSection}>
            <Text style={styles.cdcLabel}>
              CDC (Código de Controle - SIFEN)
            </Text>
            <Text style={styles.cdcValue}>{invoice.sifenCdc}</Text>

            {/* QR Code with quiet zone */}
            <View style={styles.qrContainer}>
              <Image
                src={`data:image/svg+xml;base64,${btoa(
                  QRCode.toString(qrData, { type: 'svg', margin: 2, width: 120 })
                )}`}
                style={{ width: 80, height: 80 }}
              />
              <Text style={styles.qrLabel}>
                {t('Escaneie para validar', 'Escanee para validar')}
              </Text>
              <Text
                style={{
                  fontSize: 6,
                  color: colors.racingGreen,
                  opacity: 0.5,
                  marginTop: 4,
                }}
              >
                {t('Margem de segurança 5mm', 'Margen de seguridad 5mm')}
              </Text>
            </View>
          </View>
        )}

        {/* Items Table (Bilingual) */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.colProduct}>
              {t('Produto (PT/ES)', 'Producto (PT/ES)')}
            </Text>
            <Text style={styles.colSku}>SKU</Text>
            <Text style={styles.colQty}>
              {t('Qtd', 'Cant')}
            </Text>
            <Text style={styles.colPrice}>
              {t('Preço Un.', 'Precio Un.')}
            </Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>

          {/* Items */}
          {invoice.items.map((item, index) => (
            <View style={styles.tableRow} key={index}>
              <Text style={styles.colProduct}>
                {item.product.namePt} / {item.product.nameEs}
              </Text>
              <Text style={styles.colSku}>{item.product.sku}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>
                {Number(item.unitPrice).toFixed(2)}
              </Text>
              <Text style={styles.colTotal}>
                {Number(item.totalPrice).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              {t('Total (PYG)', 'Total (PYG)')}
            </Text>
            <Text style={styles.totalValue}>
              {formatPYG(invoice.totalAmount)}
            </Text>
          </View>
          {invoice.totalUSD ? (
            <View style={styles.totalRow}>
              <Text
                style={[
                  styles.totalLabel,
                  { color: '#898989', fontSize: 8 },
                ]}
              >
                {t('Total (USD)', 'Total (USD)')}
              </Text>
              <Text
                style={[
                  styles.totalValue,
                  { color: '#898989', fontSize: 8 },
                ]}
              >
                USD {Number(invoice.totalUSD).toFixed(2)}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Footer with metadata */}
        <View style={styles.footer}>
          <Text>
            AXIS ERP - {t('Contabilidade', 'Contabilidad')} |{' '}
            {new Date().getFullYear()}
          </Text>
          <Text>
            {t('Gerado em', 'Generado el')} {formatDate(new Date())}
          </Text>
        </View>

        {/* Hidden metadata - injected via comments or custom props */}
        {tenantId && userId && (
          <View
            style={{
              position: 'absolute',
              bottom: 10,
              left: 40,
              opacity: 0,
            }}
          >
            <Text>
              tenantId:{tenantId}, userId:{userId}, checksum:{checksum || 'N/A'}
            </Text>
          </View>
        )}
      </Page>
    </Document>
  );
}

export default SifenInvoicePDF;
