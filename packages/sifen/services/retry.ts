/**
 * SIFEN Retry Service
 *
 * Handles background retry of failed SIFEN submissions.
 * Designed to work with Vercel Cron or background functions.
 *
 * Failed submissions are stored with their XML and retried periodically.
 */

import type { PrismaClient } from "@prisma/client";

export interface FailedSubmission {
  id: string;
  tenantId: string;
  invoiceId: string;
  xml: string;
  documentNumber: string;
  lastError: string;
  errorCode: string;
  attempts: number;
  maxAttempts: number;
  nextRetryAt: Date;
  createdAt: Date;
}

export class SifenRetryService {
  private prisma: PrismaClient;
  private maxAttempts = 5;
  private retryIntervalMs = 60 * 60 * 1000; // 1 hour

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Queue a failed submission for retry.
   * Called when SIFEN client returns savedLocally=true.
   */
  async queueRetry(
    tenantId: string,
    invoiceId: string,
    documentNumber: string,
    xml: string,
    lastError: string,
    errorCode: string
  ): Promise<void> {
    // In production, this would insert into a failed_submissions table
    // or queue a job in a message queue (Vercel Queues)
    console.log(`[SIFEN Retry] Queuing retry for ${documentNumber}: ${lastError}`);

    // For now, we update the invoice status to PENDING
    await this.prisma.commercialInvoice.updateMany({
      where: { id: invoiceId, tenantId },
      data: {
        sifenStatus: "PENDING",
      },
    });
  }

  /**
   * Process all pending retries.
   * Called by Vercel Cron or background function.
   */
  async processRetries(
    signAndSubmit: (xml: string, documentNumber: string) => Promise<{
      success: boolean;
      cdc?: string;
      message?: string;
    }>
  ): Promise<{ processed: number; succeeded: number; failed: number }> {
    // In production, fetch from failed_submissions table
    // For now, fetch invoices with PENDING sifenStatus
    const pendingInvoices = await this.prisma.commercialInvoice.findMany({
      where: {
        sifenStatus: "PENDING",
        sifenCdc: null,
      },
      take: 50, // Process in batches
    });

    let succeeded = 0;
    let failed = 0;

    for (const invoice of pendingInvoices) {
      try {
        // Reconstruct XML (in production, fetch from storage)
        const result = await signAndSubmit(
          "", // XML would be fetched from storage
          invoice.documentNumber || invoice.id
        );

        if (result.success && result.cdc) {
          await this.prisma.commercialInvoice.update({
            where: { id: invoice.id },
            data: {
              sifenStatus: "APPROVED",
              sifenCdc: result.cdc,
              sifenXmlUrl: (result as any).xmlUrl,
            },
          });
          succeeded++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    return {
      processed: pendingInvoices.length,
      succeeded,
      failed,
    };
  }

  /**
   * Cancel a pending invoice in SIFEN.
   */
  async cancelInvoice(
    tenantId: string,
    invoiceId: string,
    reason: string
  ): Promise<boolean> {
    const invoice = await this.prisma.commercialInvoice.findFirst({
      where: { id: invoiceId, tenantId },
    });

    if (!invoice || invoice.sifenStatus !== "APPROVED") {
      return false;
    }

    // In production, send cancellation to SIFEN
    // For now, just update status
    await this.prisma.commercialInvoice.update({
      where: { id: invoiceId },
      data: {
        sifenStatus: "CANCELLED",
      },
    });

    return true;
  }
}

export default SifenRetryService;
