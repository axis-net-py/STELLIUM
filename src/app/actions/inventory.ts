'use server'

import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import type { InventoryMovement, Product } from '@prisma/client'

export type MovementWithDetails = InventoryMovement & {
  product: { id: string; sku: string; namePt: string; nameEs: string }
}

export type ProductWithStock = Product & {
  movements: { id: string; type: string; quantity: number; createdAt: Date }[]
}

// Listar movimentações de estoque do tenant
export async function getInventoryMovements(productId?: string): Promise<MovementWithDetails[]> {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error('Tenant não encontrado')
  const tenantId = session.user.tenantId

  return prisma.inventoryMovement.findMany({
    where: {
      tenantId,
      ...(productId ? { productId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      product: {
        select: { id: true, sku: true, namePt: true, nameEs: true },
      },
    },
  }) as Promise<MovementWithDetails[]>
}

// Buscar extrato de um produto específico
export async function getProductStockHistory(productId: string): Promise<ProductWithStock | null> {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error('Tenant não encontrado')
  const tenantId = session.user.tenantId

  return prisma.product.findFirst({
    where: { id: productId, tenantId },
    include: {
      movements: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  }) as Promise<ProductWithStock | null>
}

// Ajuste manual de estoque (entrada ou saída)
export async function adjustStock(
  productId: string,
  type: 'ENTRADA' | 'SAIDA',
  quantity: number,
  reason?: string
) {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error('Tenant não encontrado')
  const tenantId = session.user.tenantId

  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId },
    select: { id: true, currentStock: true, cost: true, namePt: true },
  })
  if (!product) throw new Error('Produto não encontrado')

  if (type === 'SAIDA' && Number(product.currentStock) < quantity) {
    throw new Error(`Estoque insuficiente para o produto: ${product.namePt}. Disponível: ${product.currentStock}`)
  }

  await prisma.$transaction(async (tx: any) => {
    // Criar movimentação
    await tx.inventoryMovement.create({
      data: {
        tenantId,
        productId,
        type,
        quantity,
        unitCost: product.cost,
        totalCost: product.cost.mul(quantity),
        reason: reason ?? `Ajuste manual de estoque (${type})`,
      },
    })

    // Atualizar estoque
    await tx.product.updateMany({
      where: { id: productId, tenantId },
      data: {
        currentStock: {
          [type === 'ENTRADA' ? 'increment' : 'decrement']: quantity,
        },
      },
    })
  })

  const path = `/dashboard/inventory`
  const { revalidatePath } = await import('next/cache')
  revalidatePath(path)
}
