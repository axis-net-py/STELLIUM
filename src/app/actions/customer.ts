'use server'

import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Customer } from '@prisma/client'

export type CustomerFormData = {
  name: string
  document?: string
  documentType?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  category?: string
  isActive?: boolean
}

// Listar clientes do tenant
export async function getCustomers(): Promise<Customer[]> {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error('Tenant não encontrado')
  const tenantId = session.user.tenantId

  return prisma.customer.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
  })
}

// Buscar cliente por ID
export async function getCustomerById(id: string): Promise<Customer | null> {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error('Tenant não encontrado')
  const tenantId = session.user.tenantId

  return prisma.customer.findFirst({
    where: { id, tenantId },
  })
}

// Criar cliente
export async function createCustomer(data: CustomerFormData) {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error('Tenant não encontrado')
  const tenantId = session.user.tenantId

  await prisma.customer.create({
    data: {
      tenantId,
      name: data.name,
      document: data.document,
      documentType: data.documentType,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      country: data.country ?? 'PY',
      category: data.category ?? 'retail',
      isActive: true,
    },
  })

  revalidatePath('/dashboard/customers')
}

// Atualizar cliente
export async function updateCustomer(id: string, data: Partial<CustomerFormData>) {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error('Tenant não encontrado')
  const tenantId = session.user.tenantId

  await prisma.customer.updateMany({
    where: { id, tenantId },
    data: {
      name: data.name,
      document: data.document,
      documentType: data.documentType,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      country: data.country,
      category: data.category,
    },
  })

  revalidatePath('/dashboard/customers')
}

// Excluir cliente (soft delete ou hard delete)
export async function deleteCustomer(id: string) {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error('Tenant não encontrado')
  const tenantId = session.user.tenantId

  await prisma.customer.deleteMany({
    where: { id, tenantId },
  })

  revalidatePath('/dashboard/customers')
}
