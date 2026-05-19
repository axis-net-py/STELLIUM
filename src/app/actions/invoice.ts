'use server'

import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import type { CommercialInvoice, InvoiceItem } from '@prisma/client'
import { postInvoiceToLedger } from './accounting'
import { submitInvoiceToSifen } from './sifen'

export type InvoiceFormData = {
  type: 'PURCHASE' | 'SALES'
  customerId: string
  issuedAt?: Date
  dueDate?: Date
  currency?: string
  exchangeRate?: number
  notes?: string
  items: {
    productId: string
    quantity: number
    unitPrice: number
    taxType?: 'IVA_10' | 'IVA_5' | 'EXENTO'
    cost?: number
  }[]
}

export type InvoiceWithDetails = CommercialInvoice & {
  customer: { id: string; name: string; document?: string | null }
  items: (InvoiceItem & { product: { id: string; sku: string; namePt: string; nameEs: string } })[]
  movements: { id: string; type: string; quantity: number; product: { namePt: string } }[]
}

// Helper para cálculo de impostos paraguaios
function calculateTax(totalPrice: Prisma.Decimal, taxType: 'IVA_10' | 'IVA_5' | 'EXENTO') {
  let taxAmount = new Prisma.Decimal(0)
  let taxBase = totalPrice

  if (taxType === 'IVA_10') {
    taxAmount = totalPrice.dividedBy(11).toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP)
  } else if (taxType === 'IVA_5') {
    taxAmount = totalPrice.dividedBy(21).toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP)
  } else {
    taxAmount = new Prisma.Decimal(0)
  }

  return { taxAmount, taxBase }
}

// Listar faturas do tenant
export async function getInvoices() {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error('Tenant não encontrado')
  const tenantId = session.user.tenantId

  return prisma.commercialInvoice.findMany({
    where: { tenantId },
    orderBy: { issuedAt: 'desc' },
    include: { customer: { select: { id: true, name: true } } },
  })
}

// Buscar fatura por ID com detalhes
export async function getInvoiceById(id: string) {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error('Tenant não encontrado')
  const tenantId = session.user.tenantId

  return prisma.commercialInvoice.findFirst({
    where: { id, tenantId },
    include: {
      customer: { select: { id: true, name: true, document: true } },
      items: {
        include: { product: { select: { id: true, sku: true, namePt: true, nameEs: true } } },
      },
      movements: {
        include: { product: { select: { namePt: true } } },
      },
    },
  })
}

// Criar Fatura de Compra (incrementa estoque) — transação atômica
export async function createPurchaseInvoice(data: InvoiceFormData) {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error('Tenant não encontrado')
  const tenantId = session.user.tenantId

  const result = await prisma.$transaction(async (tx: any) => {
    // 1. Criar a fatura
    const invoice = await tx.commercialInvoice.create({
      data: {
        tenantId,
        type: 'PURCHASE',
        status: 'APPROVED',
        customerId: data.customerId,
        issuedAt: data.issuedAt ?? new Date(),
        dueDate: data.dueDate,
        currency: data.currency as any ?? 'PYG',
        exchangeRate: new Prisma.Decimal(data.exchangeRate ?? 1),
        notes: data.notes,
        totalAmount: new Prisma.Decimal(0),
      },
    })

    let totalAmount = new Prisma.Decimal(0)
    let totalIva10 = new Prisma.Decimal(0)
    let totalIva5 = new Prisma.Decimal(0)
    let totalExento = new Prisma.Decimal(0)

    // 2. Criar itens e movimentações de estoque (ENTRADA)
    for (const item of data.items) {
      const product = await tx.product.findFirst({
        where: { id: item.productId, tenantId },
        select: { id: true, currentStock: true, namePt: true, taxType: true },
      })
      if (!product) throw new Error(`Produto ${item.productId} não encontrado`)

      const quantity = item.quantity
      const unitPrice = new Prisma.Decimal(item.unitPrice)
      const totalPrice = unitPrice.mul(quantity)
      const cost = new Prisma.Decimal(item.cost ?? item.unitPrice)
      const taxType = item.taxType ?? product.taxType

      const { taxAmount, taxBase } = calculateTax(totalPrice, taxType)

      // Criar item da fatura
      await tx.invoiceItem.create({
        data: {
          commercialInvoiceId: invoice.id,
          productId: item.productId,
          quantity,
          unitPrice,
          totalPrice,
          taxType,
          taxBase,
          taxAmount,
          cost,
        },
      })

      // Criar movimentação de estoque (ENTRADA)
      await tx.inventoryMovement.create({
        data: {
          tenantId,
          productId: item.productId,
          type: 'ENTRADA',
          quantity,
          unitCost: cost,
          totalCost: cost.mul(quantity),
          reason: `Fatura de Compra #${invoice.id.slice(-6)}`,
          commercialInvoiceId: invoice.id,
        },
      })

      // Atualizar estoque do produto (incrementar)
      await tx.product.updateMany({
        where: { id: item.productId, tenantId },
        data: { currentStock: { increment: quantity } },
      })

      totalAmount = totalAmount.add(totalPrice)
      if (taxType === 'IVA_10') totalIva10 = totalIva10.add(taxAmount)
      else if (taxType === 'IVA_5') totalIva5 = totalIva5.add(taxAmount)
      else totalExento = totalExento.add(totalPrice)
    }

    // 3. Atualizar total da fatura
    await tx.commercialInvoice.update({
      where: { id: invoice.id },
      data: { 
        totalAmount,
        totalIva10,
        totalIva5,
        totalExento
      },
    })

    // 4. Automatizar lançamento contábil
    await postInvoiceToLedger(invoice.id, tx)

    return invoice
  })

  revalidatePath('/dashboard/invoices')
  revalidatePath('/dashboard/inventory')
  return result
}

// Criar Fatura de Venda (valida estoque, decrementa) — transação atômica
export async function createSalesInvoice(data: InvoiceFormData) {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error('Tenant não encontrado')
  const tenantId = session.user.tenantId

  const result = await prisma.$transaction(async (tx: any) => {
    // 1. Validar estoque para todos os itens antes de qualquer operação
    for (const item of data.items) {
      const product = await tx.product.findFirst({
        where: { id: item.productId, tenantId },
        select: { id: true, currentStock: true, namePt: true, nameEs: true },
      })
      if (!product) throw new Error(`Produto ${item.productId} não encontrado`)
      if (product.currentStock < item.quantity) {
        throw new Error(`Estoque insuficiente para o produto: ${product.namePt} (${product.nameEs}). Disponível: ${product.currentStock}, Solicitado: ${item.quantity}`)
      }
    }

    // 2. Criar a fatura
    const invoice = await tx.commercialInvoice.create({
      data: {
        tenantId,
        type: 'SALES',
        status: 'APPROVED',
        customerId: data.customerId,
        issuedAt: data.issuedAt ?? new Date(),
        dueDate: data.dueDate,
        currency: data.currency as any ?? 'PYG',
        exchangeRate: new Prisma.Decimal(data.exchangeRate ?? 1),
        notes: data.notes,
        totalAmount: new Prisma.Decimal(0),
      },
    })

    let totalAmount = new Prisma.Decimal(0)
    let totalIva10 = new Prisma.Decimal(0)
    let totalIva5 = new Prisma.Decimal(0)
    let totalExento = new Prisma.Decimal(0)

    // 3. Criar itens e movimentações de estoque (SAIDA)
    for (const item of data.items) {
      const product = await tx.product.findFirst({
        where: { id: item.productId, tenantId },
        select: { id: true, currentStock: true, namePt: true, cost: true, taxType: true },
      })
      if (!product) throw new Error(`Produto ${item.productId} não encontrado`)

      const quantity = item.quantity
      const unitPrice = new Prisma.Decimal(item.unitPrice)
      const totalPrice = unitPrice.mul(quantity)
      const cost = product.cost ?? new Prisma.Decimal(item.cost ?? 0)
      const taxType = item.taxType ?? product.taxType

      const { taxAmount, taxBase } = calculateTax(totalPrice, taxType)

      // Criar item da fatura
      await tx.invoiceItem.create({
        data: {
          commercialInvoiceId: invoice.id,
          productId: item.productId,
          quantity,
          unitPrice,
          totalPrice,
          taxType,
          taxBase,
          taxAmount,
          cost,
        },
      })

      // Criar movimentação de estoque (SAIDA)
      await tx.inventoryMovement.create({
        data: {
          tenantId,
          productId: item.productId,
          type: 'SAIDA',
          quantity,
          unitCost: cost,
          totalCost: cost.mul(quantity),
          reason: `Fatura de Venda #${invoice.id.slice(-6)}`,
          commercialInvoiceId: invoice.id,
        },
      })

      // Atualizar estoque do produto (decrementar)
      await tx.product.updateMany({
        where: { id: item.productId, tenantId },
        data: { currentStock: { decrement: quantity } },
      })

      totalAmount = totalAmount.add(totalPrice)
      if (taxType === 'IVA_10') totalIva10 = totalIva10.add(taxAmount)
      else if (taxType === 'IVA_5') totalIva5 = totalIva5.add(taxAmount)
      else totalExento = totalExento.add(totalPrice)
    }

    // 4. Atualizar total da fatura
    await tx.commercialInvoice.update({
      where: { id: invoice.id },
      data: { 
        totalAmount,
        totalIva10,
        totalIva5,
        totalExento
      },
    })

    // 5. Automatizar lançamento contábil
    await postInvoiceToLedger(invoice.id, tx)

    return invoice
  })

  // 6. Integração SIFEN (Real-time, non-blocking)
  // Executado fora da transação para não travar o banco em caso de timeout do Sifen
  try {
    submitInvoiceToSifen(tenantId, result.id)
  } catch (err) {
    console.error('[SIFEN] Background submission trigger failed:', err)
  }

  revalidatePath('/dashboard/invoices')
  revalidatePath('/dashboard/inventory')
  return result
}

// Cancelar fatura (reverte estoque)
export async function cancelInvoice(id: string) {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error('Tenant não encontrado')
  const tenantId = session.user.tenantId

  const invoice = await prisma.commercialInvoice.findFirst({
    where: { id, tenantId },
    include: { items: true, movements: true },
  })
  if (!invoice) throw new Error('Fatura não encontrada')
  if (invoice.status === 'CANCELLED') throw new Error('Fatura já cancelada')

  await prisma.$transaction(async (tx: any) => {
    // Reverter movimentações de estoque
    for (const movement of invoice.movements) {
      const reverseType = movement.type === 'ENTRADA' ? 'SAIDA' : 'ENTRADA'
      await tx.product.updateMany({
        where: { id: movement.productId, tenantId },
        data: {
          currentStock: {
            [reverseType === 'ENTRADA' ? 'increment' : 'decrement']: movement.quantity,
          },
        },
      })
    }

    // Marcar fatura como cancelada
    await tx.commercialInvoice.update({
      where: { id },
      data: { status: 'CANCELLED' },
    })
  })

  revalidatePath('/dashboard/invoices')
  revalidatePath('/dashboard/inventory')
}
