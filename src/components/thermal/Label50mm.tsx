import React from 'react';
import { Document, Page, View, Text, StyleSheet, Font } from '@react-pdf/renderer';

// ─── Register Courier for barcode-like text ─────────
Font.register({
  family: 'Courier',
  fonts: [{ src: 'https://fonts.gstatic.com/s/robotomono/v23/L0x5DF4xlVMF-BfR8ERahxtEgPqJwyJbwV40K.css' }],
});

// ─── Types ──────────────────────────────────────
interface Label50mmProps {
  sku: string;
  productName: string;
  pricePYG: number;
  priceUSD?: number;
  tenantName?: string;
}

// ─── Component: Label50mm ─────────────────────────
export function Label50mm({
  sku,
  productName,
  pricePYG,
  priceUSD,
  tenantName,
}: Label50mmProps) {
  const width = 142; // 50mm in points

  return (
    <Document>
      <Page size={[width, 'auto']} style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{tenantName || 'AXIS'}</Text>
          <Text style={styles.subtitle}>ETIQUETA DE PRODUTO</Text>
        </View>

        {/* Product Name */}
        <View style={styles.productSection}>
          <Text style={styles.productName}>{productName}</Text>
        </View>

        {/* SKU - Barcode-like Display */}
        <View style={styles.skuSection}>
          <Text style={styles.skuBarcode}>{sku}</Text>
          <Text style={styles.skuLabel}>SKU</Text>
        </View>

        {/* Price Section */}
        <View style={styles.priceSection}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>PYG</Text>
            <Text style={styles.pricePYG}>
              Gs. {Math.round(pricePYG).toLocaleString('pt-BR')}
            </Text>
          </View>

          {priceUSD ? (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabelUSD}>USD</Text>
              <Text style={styles.priceUSD}>
                USD {Number(priceUSD).toFixed(2)}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>AXIS ERP</Text>
        </View>
      </Page>
    </Document>
  );
}

// ─── Styles ──────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    width: 142, // 50mm
    padding: 8,
    backgroundColor: '#FFFFFF',
    color: '#000000',
    fontFamily: 'Helvetica',
    fontSize: 7,
  },
  header: {
    textAlign: 'center',
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 4,
  },
  title: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 5,
    textAlign: 'center',
    marginTop: 2,
    opacity: 0.7,
  },
  productSection: {
    marginVertical: 6,
    alignItems: 'center',
  },
  productName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    textAlign: 'center',
  },
  skuSection: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
    borderTopWidth: 1,
    borderTopColor: '#000000',
    paddingTop: 6,
  },
  skuBarcode: {
    fontFamily: 'Courier',
    fontSize: 12,
    textAlign: 'center',
    letterSpacing: 2,
  },
  skuLabel: {
    fontSize: 5,
    textAlign: 'center',
    marginTop: 2,
    opacity: 0.5,
  },
  priceSection: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#000000',
    paddingTop: 3,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  priceLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#000000',
  },
  pricePYG: {
    fontFamily: 'Courier',
    fontSize: 8,
    color: '#000000',
  },
  priceLabelUSD: {
    fontSize: 6,
    opacity: 0.7,
  },
  priceUSD: {
    fontFamily: 'Courier',
    fontSize: 6,
    opacity: 0.7,
  },
  footer: {
    textAlign: 'center',
    fontSize: 5,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#000000',
    paddingTop: 4,
    opacity: 0.5,
  },
  footerText: {
    fontSize: 5,
  },
});
