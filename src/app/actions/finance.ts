"use server";

import prisma from "@/lib/prisma";
import { Currency, TransactionType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { z } from "zod";

const FinanceTransactionSchema = z.object({
  type: z.nativeEnum(TransactionType),
  entityId: z.string().min(1, "Entidad es requerida"),
  category: z.string().min(1, "Categoría es requerida"),
  currency: z.nativeEnum(Currency),
  amount: z.number().positive("Monto debe ser mayor a 0"),
  exchangeRate: z.number().positive("Tasa de cambio debe ser positiva").default(1),
});

export type FinanceTransactionInput = z.infer<typeof FinanceTransactionSchema>;

export async function createFinanceTransaction(data: FinanceTransactionInput) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { success: false, error: "Unauthorized" };
    }

    const totalPyg = data.currency === Currency.PYG ? data.amount : data.amount * data.exchangeRate;

    const transaction = await prisma.transaction.create({
      data: {
        tenantId: session.user.tenantId,
        type: data.type,
        entityId: data.entityId,
        currency: data.currency,
        amount: data.amount,
        exchangeRate: data.exchangeRate,
        totalPyg: totalPyg,
        // category: data.category, // Assuming category mapping or adding to schema if needed
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        action: "CREATE_FINANCE_TRANSACTION",
        details: {
          transactionId: transaction.id,
          type: data.type,
          entityId: data.entityId,
          amount: data.amount,
          currency: data.currency,
          totalPyg: totalPyg,
        },
      },
    });

    revalidatePath(`/${session.user.tenantId}/finanzas`);
    revalidatePath('/finanzas');
    return { success: true, transaction };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}
