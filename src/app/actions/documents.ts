"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ─── Types ──────────────────────────────────────

export type PrintType = "thermal" | "laser";

// ─── Get Document URL for Printing ─────────────────────────

export async function getDocumentUrl(
  type: PrintType,
  documentId: string
): Promise<{ url: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { url: "", error: "Unauthorized" };
    }

    const tenantId = session.user.tenantId;

    if (type === "laser") {
      return { url: `/api/v1/invoices/${documentId}/generate` };
    }
    return { url: `/thermal/${documentId}` };
  } catch (error: any) {
    return {
      url: "",
      error: error.message || "Failed to get document URL",
    };
  }
}

// ─── Validate Document Access ─────────────────────────

export async function validateDocumentAccess(
  documentId: string,
  documentType: "invoice" | "receipt" | "label"
): Promise<{ valid: boolean; tenantId?: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { valid: false, error: "Unauthorized" };
    }

    const tenantId = session.user.tenantId;

    if (documentType === "invoice") {
      const doc = await prisma.commercialInvoice.findUnique({
        where: { id: documentId },
        select: { tenantId: true },
      });
      if (!doc || doc.tenantId !== tenantId) {
        return { valid: false, error: "Document not found" };
      }
      return { valid: true, tenantId };
    }

    return { valid: false, error: "Unsupported document type" };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || "Validation failed",
    };
  }
}

// ─── Log Print Action (Audit) ─────────────────────

export async function logPrintAction(
  documentId: string,
  printType: PrintType,
  tenantId: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return;

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: session.user.id,
        action: "PRINT_DOCUMENT",
        entity: printType,
        entityId: documentId,
        details: {
          documentId,
          printType,
          timestamp: new Date().toISOString(),
        },
      },
    });

    revalidatePath(`/${tenantId}/settings/team`);
  } catch (error) {
    console.error("Failed to log print action:", error);
  }
}
