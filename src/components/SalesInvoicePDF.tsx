import React from "react";
import { Document, Page, View, Text, StyleSheet, Font } from "@react-pdf/renderer";

// Helvetica is a standard PDF font - no registration needed
// Custom fonts can be registered here if needed

interface InvoicePDFProps {
  invoice: {
    id: string;
    type: string;
    issuedAt: string | Date;
    customer: { name: string; document?: string | null };
    items: {
      product: { namePt: string; nameEs: string; sku: string };
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }[];
    totalAmount: number;
  };
}

export function SalesInvoicePDF({ invoice }: InvoicePDFProps) {
  const styles = StyleSheet.create({
    page: { padding: 40, fontSize: 11, fontFamily: "Helvetica" },
    header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
    title: { fontSize: 18, fontWeight: "bold" },
    subtitle: { fontSize: 10, color: "#666" },
    section: { marginBottom: 15 },
    table: { display: "flex", width: "auto", borderWidth: 1, borderColor: "#000" },
    tableRow: { flexDirection: "row" },
    tableColHeader: {
      borderWidth: 1,
      borderColor: "#000",
      padding: 5,
      fontWeight: "bold",
      backgroundColor: "#f0f0f0",
      fontSize: 10,
    },
    tableCol: { borderWidth: 1, borderColor: "#000", padding: 5, fontSize: 10 },
    total: { marginTop: 10, textAlign: "right", fontSize: 14, fontWeight: "bold" },
    footer: { position: "absolute", bottom: 30, left: 40, right: 40, textAlign: "center", fontSize: 9, color: "#666" },
  });

  const isPurchase = invoice.type === "PURCHASE";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>AXIS ERP</Text>
            <Text style={styles.subtitle}>
              {isPurchase ? "Fatura de Compra" : "Fatura de Venda"}
            </Text>
          </View>
          <View>
            <Text style={{ textAlign: "right", fontWeight: "bold" }}>
              #{invoice.id.slice(-8).toUpperCase()}
            </Text>
            <Text style={{ textAlign: "right", fontSize: 10 }}>
              {new Date(invoice.issuedAt).toLocaleDateString("pt-BR")}
            </Text>
          </View>
        </View>

        {/* Informações do Cliente */}
        <View style={styles.section}>
          <Text style={{ fontWeight: "bold", marginBottom: 5 }}>
            {isPurchase ? "Fornecedor:" : "Cliente:"}
          </Text>
          <Text>{invoice.customer.name}</Text>
          {invoice.customer.document && (
            <Text style={{ fontSize: 10, color: "#666" }}>
              Doc: {invoice.customer.document}
            </Text>
          )}
        </View>

        {/* Tabela de Itens (Bilíngue) */}
        <View style={styles.table}>
          {/* Cabeçalho da Tabela */}
          <View style={[styles.tableRow, { backgroundColor: "#f0f0f0" }]}>
            <Text style={[styles.tableColHeader, { width: "40%" }]}>Produto (PT/ES)</Text>
            <Text style={[styles.tableColHeader, { width: "15%" }]}>SKU</Text>
            <Text style={[styles.tableColHeader, { width: "15%" }]}>Qtd</Text>
            <Text style={[styles.tableColHeader, { width: "15%" }]}>Preço Un.</Text>
            <Text style={[styles.tableColHeader, { width: "15%" }]}>Total</Text>
          </View>

          {/* Itens */}
          {invoice.items.map((item, index) => (
            <View style={styles.tableRow} key={index}>
              <Text style={[styles.tableCol, { width: "40%" }]}>
                {item.product.namePt} / {item.product.nameEs}
              </Text>
              <Text style={[styles.tableCol, { width: "15%" }]}>{item.product.sku}</Text>
              <Text style={[styles.tableCol, { width: "15%" }]}>{item.quantity}</Text>
              <Text style={[styles.tableCol, { width: "15%" }]}>
                {Number(item.unitPrice).toFixed(2)}
              </Text>
              <Text style={[styles.tableCol, { width: "15%" }]}>
                {Number(item.totalPrice).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Total */}
        <View style={styles.total}>
          <Text>Total: {Number(invoice.totalAmount).toFixed(2)}</Text>
        </View>

        {/* Rodapé */}
        <Text style={styles.footer}>
          AXIS ERP - Sistemas de Gestão Empresarial | {new Date().getFullYear()}
        </Text>
      </Page>
    </Document>
  );
}
