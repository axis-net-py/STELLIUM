'use server'

import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import type { Product } from '@prisma/client'

export type ProductFormData = {
  sku: string
  namePt: string
  nameEs: string
  price: number | string
  cost: number | string
  unit?: string
  currentStock?: number
  minStock?: number
  isActive?: boolean
}

// Listar produtos do tenant
export async function getProducts(): Promise<Product[]> {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error('Tenant não encontrado')
  const tenantId = session.user.tenantId

  return prisma.product.findMany({
    where: { tenantId },
    orderBy: { namePt: 'asc' },
  })
}

// Buscar produto por ID
export async function getProductById(id: string): Promise<Product | null> {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error('Tenant não encontrado')
  const tenantId = session.user.tenantId

  return prisma.product.findFirst({
    where: { id, tenantId },
    include: { movements: { orderBy: { createdAt: 'desc' }, take: 10 } },
  })
}

// Criar produto
export async function createProduct(data: ProductFormData) {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error('Tenant não encontrado')
  const tenantId = session.user.tenantId

  await prisma.product.create({
    data: {
      tenantId,
      sku: data.sku,
      namePt: data.namePt,
      nameEs: data.nameEs,
      price: new Prisma.Decimal(data.price),
      cost: new Prisma.Decimal(data.cost ?? 0),
      unit: data.unit ?? 'un',
      currentStock: data.currentStock ?? 0,
      minStock: data.minStock ?? 0,
      isActive: data.isActive ?? true,
    },
  })

  revalidatePath('/dashboard/products')
}

// Atualizar produto
export async function updateProduct(id: string, data: Partial<ProductFormData>) {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error('Tenant não encontrado')
  const tenantId = session.user.tenantId

  const updateData: any = {}
  if (data.sku !== undefined) updateData.sku = data.sku
  if (data.namePt !== undefined) updateData.namePt = data.namePt
  if (data.nameEs !== undefined) updateData.nameEs = data.nameEs
  if (data.price !== undefined) updateData.price = new Prisma.Decimal(data.price)
  if (data.cost !== undefined) updateData.cost = new Prisma.Decimal(data.cost ?? 0)
  if (data.unit !== undefined) updateData.unit = data.unit
  if (data.currentStock !== undefined) updateData.currentStock = data.currentStock
  if (data.minStock !== undefined) updateData.minStock = data.minStock
  if (data.isActive !== undefined) updateData.isActive = data.isActive

  await prisma.product.updateMany({
    where: { id, tenantId },
    data: updateData,
  })

  revalidatePath('/dashboard/products')
}

// Excluir produto
export async function deleteProduct(id: string) {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error('Tenant não encontrado')
  const tenantId = session.user.tenantId

  await prisma.product.deleteMany({
    where: { id, tenantId },
  })

  revalidatePath('/dashboard/products')
}

// Buscar produto por SKU (para validação)
export async function getProductBySku(sku: string): Promise<Product | null> {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error('Tenant não encontrado')
  const tenantId = session.user.tenantId

  return prisma.product.findFirst({
    where: { tenantId, sku },
  })
}
