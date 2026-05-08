"use server";

import { auth } from "@/auth";
import { prismaWithTenant } from "@axis/core/prisma/client";
import { checkPermission } from "@axis/core/lib/auth/guard";
import { revalidatePath } from "next/cache";

// ─── Types ──────────────────────────────────────

export type PrintType = "thermal" | "laser";

interface DocumentInfo {
  id: string;
  type: string;
  tenantId: string;
}

// ─── Get Document URL for Laser Printing ─────────────────

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

    // Check permission based on document type
    const permission =
      type === "laser" ? "accounting:read" : "settings:read";
    const hasPermission = await checkPermission(
      session.user.id,
      permission,
      tenantId
    );

    if (!hasPermission) {
      return { url: "", error: "Forbidden" };
    }

    // Return the API URL for PDF generation
    if (type === "laser") {
      return {
        url: `/api/v1/invoices/${documentId}/generate`,
      };
    }

    // For thermal, return a client-side render URL
    return {
      url: `/thermal/${documentId}`,
    };
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
    const prisma = prismaWithTenant(tenantId);

    // Check if document belongs to tenant
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

    // Add other document types as needed
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

    const { logAudit } = await import("@axis/core/lib/auth/guard");
    await logAudit(session.user.id, tenantId, "PRINT_DOCUMENT", {
      documentId,
      printType,
      timestamp: new Date().toISOString(),
    });

    revalidatePath(`/${tenantId}/settings/team`);
  } catch (error) {
    console.error("Failed to log print action:", error);
  }
}
