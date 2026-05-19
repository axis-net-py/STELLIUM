"use server";

import prisma from "@/lib/prisma";
import type { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

// ─── Helper: Check permission inline ──────────────────────

async function checkPermission(userId: string, action: string, tenantId: string): Promise<boolean> {
  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId },
    select: { role: true },
  });
  if (!user) return false;
  if (user.role === "SOVEREIGN") return true;

  const perm = await prisma.permission.findFirst({
    where: { action, role: user.role, tenantId },
  });
  return !!perm;
}

async function logAudit(userId: string, tenantId: string, action: string, details: any) {
  await prisma.auditLog.create({
    data: {
      tenantId,
      userId,
      action,
      details,
    },
  });
}

// ─── Get Users for Tenant ────────────────────────────────

export async function getUsers(tenantId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const hasPerm = await checkPermission(session.user.id, "settings:read", tenantId);
  if (!hasPerm) throw new Error("Forbidden");

  return await prisma.user.findMany({
    where: { tenantId },
    select: { id: true, email: true, name: true, role: true },
    orderBy: { email: "asc" },
  });
}

// ─── Update User Role ──────────────────────────────────────

export async function updateUserRole(userId: string, newRole: Role) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Get tenant from target user
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { tenantId: true },
  });
  if (!targetUser) throw new Error("User not found");

  const hasPerm = await checkPermission(session.user.id, "users:manage", targetUser.tenantId);
  if (!hasPerm) throw new Error("Forbidden");

  const user = await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });

  await logAudit(session.user.id, targetUser.tenantId, "UPDATE_USER_ROLE", { userId, newRole });
  revalidatePath(`/${targetUser.tenantId}/settings/team`);
  return { success: true, user };
}

// ─── Get Permissions for Tenant ─────────────────────────────

export async function getPermissions(tenantId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const hasPerm = await checkPermission(session.user.id, "settings:read", tenantId);
  if (!hasPerm) throw new Error("Forbidden");

  return await prisma.permission.findMany({
    where: { tenantId },
    orderBy: { action: "asc" },
  });
}

// ─── Update Permission ──────────────────────────────────────

export async function updatePermission(
  tenantId: string,
  action: string,
  role: Role,
  enabled: boolean
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const hasPerm = await checkPermission(session.user.id, "settings:write", tenantId);
  if (!hasPerm) throw new Error("Forbidden");

  if (enabled) {
    await prisma.permission.upsert({
      where: { action_role_tenantId: { action, role, tenantId } },
      update: {},
      create: { action, role, tenantId },
    });
  } else {
    await prisma.permission.deleteMany({
      where: { action, role, tenantId },
    });
  }

  await logAudit(session.user.id, tenantId, "UPDATE_PERMISSION", { action, role, enabled });
  revalidatePath(`/${tenantId}/settings/team`);
  return { success: true };
}

// ─── Seed Default Permissions ──────────────────────────────

export async function seedDefaultPermissions(tenantId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const hasPerm = await checkPermission(session.user.id, "settings:write", tenantId);
  if (!hasPerm) throw new Error("Forbidden");

  const actions = [
    "dashboard:read", "customers:read", "customers:write", "customers:delete",
    "suppliers:read", "suppliers:write", "suppliers:delete",
    "products:read", "products:write", "products:delete",
    "invoices:read", "invoices:write", "invoices:delete",
    "inventory:read", "inventory:write",
    "accounting:read", "accounting:write",
    "reports:read",
    "settings:read", "settings:write",
    "users:manage",
  ];

  const roles = ["ADMIN", "OPERATOR", "AUDITOR"] as const;

  for (const action of actions) {
    for (const role of roles) {
      await prisma.permission.upsert({
        where: { action_role_tenantId: { action, role, tenantId } },
        update: {},
        create: { action, role, tenantId },
      });
    }
  }

  await logAudit(session.user.id, tenantId, "SEED_PERMISSIONS", { count: actions.length * roles.length });
  revalidatePath(`/${tenantId}/settings/team`);
  return { success: true, count: actions.length * roles.length };
}
