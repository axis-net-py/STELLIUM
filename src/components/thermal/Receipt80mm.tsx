import React from 'react';
import { Document, Page, View, Text, StyleSheet, Font } from '@react-pdf/renderer';
import type { CommercialInvoice as InvoiceType } from '@prisma/client';

// ─── Register Courier for barcode-like text ─────────────
Font.register({
  family: 'Courier',
  fonts: [{ src: 'https://fonts.gstatic.com/s/robotomono/v23/L0x5DF4xlVMF-BfR8ERahxtEgPqJwyJbwV40K.css' }],
});

// ─── Types ──────────────────────────────────────────
interface Receipt80mmProps {
  invoice: {
    id: string;
    number?: string;
    issuedAt: Date | string;
    customer: { name: string };
    items: {
      product: { namePt: string; sku: string };
      quantity: number;
      totalPrice: number;
    }[];
    totalAmount: number;
    totalUSD?: number;
  };
  tenantName?: string;
}

// ─── Component: Receipt80mm ─────────────────────────
export function Receipt80mm({ invoice, tenantName }: Receipt80mmProps) {
  const width = 227; // 80mm in points

  return (
    <Document>
      <Page size={[width, 'auto']} style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>AXIS ERP</Text>
          <Text style={styles.subtitle}>
            {tenantName || 'Sistema de Gestão'}
          </Text>
          <Text style={styles.date}>
            {new Date(invoice.issuedAt).toLocaleString('pt-BR')}
          </Text>
        </View>

        {/* Invoice Number - Mono Font */}
        <View style={styles.section}>
          <Text style={styles.monoText}>
            #{invoice.number || invoice.id.slice(-8).toUpperCase()}
          </Text>
        </View>

        {/* Customer */}
        <View style={styles.section}>
          <Text style={{ fontSize: 7 }}>{invoice.customer.name}</Text>
        </View>

        {/* Items - Simple list */}
        {invoice.items.map((item, idx) => (
          <View style={styles.row} key={idx}>
            <Text style={{ width: '60%', fontSize: 7 }}>
              {item.product.namePt}
            </Text>
            <Text style={{ width: '20%', fontSize: 7, textAlign: 'center' }}>
              x{item.quantity}
            </Text>
            <Text style={{ width: '20%', fontSize: 7, textAlign: 'right' }}>
              {Number(item.totalPrice).toFixed(2)}
            </Text>
          </View>
        ))}

        {/* SKU Barcode Section */}
        <View style={styles.barcodeSection}>
          <Text style={styles.monoText}>{invoice.items[0]?.product.sku || 'N/A'}</Text>
          <Text style={{ fontSize: 6, marginTop: 2, opacity: 0.5 }}>
            SKU
          </Text>
        </View>

        {/* Total */}
        <View style={styles.totalRow}>
          <Text>TOTAL (PYG)</Text>
          <Text style={{ fontFamily: 'Courier' }}>
            Gs. {Number(invoice.totalAmount).toFixed(2)}
          </Text>
        </View>

        {invoice.totalUSD ? (
          <View style={styles.totalRow}>
            <Text style={{ fontSize: 6, opacity: 0.7 }}>USD</Text>
            <Text style={{ fontSize: 6, fontFamily: 'Courier', opacity: 0.7 }}>
              USD {Number(invoice.totalUSD).toFixed(2)}
            </Text>
          </View>
        ) : null}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>AXIS ERP • {new Date().getFullYear()}</Text>
          <Text style={{ fontSize: 5, marginTop: 2, opacity: 0.5 }}>
            Obrigado pela preferência!
          </Text>
        </View>
      </Page>
    </Document>
  );
}

// ─── Styles ──────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    width: 227, // 80mm
    padding: 10,
    backgroundColor: '#FFFFFF',
    color: '#000000',
    fontFamily: 'Helvetica',
    fontSize: 8,
  },
  header: {
    textAlign: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 6,
  },
  title: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 7,
    textAlign: 'center',
    marginTop: 2,
  },
  date: {
    fontSize: 6,
    textAlign: 'center',
    marginTop: 2,
    opacity: 0.6,
  },
  section: {
    marginVertical: 6,
  },
  monoText: {
    fontFamily: 'Courier',
    fontSize: 10,
    textAlign: 'center',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  barcodeSection: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
    borderTopWidth: 1,
    borderTopColor: '#000000',
    paddingTop: 6,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#000000',
    paddingTop: 4,
    marginTop: 4,
    fontFamily: 'Helvetica-Bold',
  },
  footer: {
    textAlign: 'center',
    fontSize: 6,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#000000',
    paddingTop: 4,
  },
});
