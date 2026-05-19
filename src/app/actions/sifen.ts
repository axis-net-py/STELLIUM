"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { SifenInvoice, SifenConfig } from "@axis/sifen";
import { SifenClient } from "@axis/sifen";

/**
 * Submit an invoice to SIFEN (silent mode).
 * Never blocks business operations - failures are handled gracefully.
 */
export async function submitInvoiceToSifen(
  tenantId: string,
  invoiceId: string,
  locale: string = "pt-BR"
): Promise<{ success: boolean; message: string; cdc?: string }> {
  try {
    // Fetch invoice with all required data
    const invoice = await prisma.commercialInvoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: {
        customer: true,
        items: { include: { product: true } },
        tenant: true,
      },
    });

    if (!invoice) {
      return { success: false, message: "Invoice not found" };
    }

    // Get tenant SIFEN config
    const sifenConfig: SifenConfig = {
      ruc: invoice.tenant.ruc || "",
      businessName: invoice.tenant.businessName || "",
      tradeName: invoice.tenant.tradeName || undefined,
      establishment: invoice.tenant.establishment || "001",
      emissionPoint: invoice.tenant.emissionPoint || "001",
      address: invoice.tenant.address || "",
      economicActivity: invoice.tenant.economicActivity || "",
    };

    // Get latest exchange rate
    const exchangeRate = await prisma.exchangeRate.findFirst({
      where: { tenantId },
      orderBy: { date: "desc" },
    });

    // Map invoice to SIFEN format
    const sifenInvoice: SifenInvoice = {
      documentType: invoice.type === "SALES" ? "FACTURA" : "FACTURA",
      documentNumber: invoice.documentNumber || "",
      stamp: "",
      issueDate: invoice.issuedAt,
      totalAmount: Number(invoice.totalAmount),
      totalIva10: 0, // Calculate from items
      totalIva5: 0,
      totalExento: 0,
      currency: invoice.currency,
      exchangeRate: exchangeRate ? Number(exchangeRate.ratePYGtoUSD) : undefined,
      items: invoice.items.map((item) => ({
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        description: item.product.namePt || item.product.nameEs || "",
        taxType: "IVA_10" as const,
        taxAmount: 0,
        unit: item.product.unit || "un",
      })),
      customerDocument: invoice.customer?.document || "00000000",
      customerName: invoice.customer?.name || "Consumidor Final",
      customerType: "JURIDICA",
      customerDocType: (invoice.customer?.documentType as "RUC" | "CEDULA" | "PASAPORTE" | "EXTRANJERO") || "RUC",
    };

    // Create SIFEN client
    const sifenClient = new SifenClient(sifenConfig, {
      apiUrl: process.env.SIFEN_API_URL || "https://sifen.set.gov.py/de/factura",
      certificate: process.env.SIFEN_CERTIFICATE || "",
      certificatePass: process.env.SIFEN_CERTIFICATE_PASS || "",
      timeout: 30000,
      retryAttempts: 3,
    });

    // Submit to SIFEN
    const result = await sifenClient.submitInvoice(sifenInvoice);

    // Update invoice with SIFEN response
    await prisma.commercialInvoice.update({
      where: { id: invoiceId },
      data: {
        sifenStatus: result.success ? "APPROVED" : result.shouldRetry ? "PENDING" : "REJECTED",
        sifenCdc: result.cdc || undefined,
        sifenXmlUrl: result.xmlUrl || undefined,
      },
    });

    // Localize message
    const messages: Record<string, Record<string, string>> = {
      "pt-BR": {
        success: "Fatura enviada ao SIFEN com sucesso",
        pending: "Fatura salva localmente. Tentativa de envio agendada.",
        rejected: "Fatura rejeitada pelo SIFEN",
      },
      "es-PY": {
        success: "Factura enviada a SIFEN exitosamente",
        pending: "Factura guardada localmente. Envío programado.",
        rejected: "Factura rechazada por SIFEN",
      },
    };

    const localized = messages[locale] || messages["pt-BR"];

    if (result.success) {
      revalidatePath(`/${tenantId}/invoices/${invoiceId}`);
      return {
        success: true,
        message: localized.success,
        cdc: result.cdc,
      };
    }

    if (result.savedLocally) {
      return {
        success: false,
        message: localized.pending,
      };
    }

    return {
      success: false,
      message: localized.rejected,
    };
  } catch (error) {
    console.error("[SIFEN] Submission error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Retry all pending SIFEN submissions.
 * Called by Vercel Cron or background job.
 */
export async function retryPendingSifenSubmissions(tenantId: string): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  // This would be implemented with the SifenRetryService
  // For now, return a placeholder
  return { processed: 0, succeeded: 0, failed: 0 };
}
