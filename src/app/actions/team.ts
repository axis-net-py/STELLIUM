"use server";

import { prismaWithTenant } from "@axis/core/prisma/client";
import type { Role, Permission } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { withAuth, checkPermission, logAudit } from "@axis/core/lib/auth/guard";

// ─── Get Users for Tenant ────────────────────────────────

export async function getUsers(tenantId: string) {
  return await withAuth(
    'settings:read',
    tenantId,
    async () => {
      const prisma = prismaWithTenant(tenantId);

      return await prisma.user.findMany({
        where: { tenantId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
        orderBy: { email: 'asc' }
      });
    }
  );
}

// ─── Update User Role ──────────────────────────────────────

export async function updateUserRole(userId: string, newRole: Role) {
  return await withAuth(
    'users:manage',
    // We need tenantId - get it from the user's record
    // For now, we'll use the session
    // TODO: get tenantId from user record
    '',
    async () => {
      const session = await auth();
      const tenantId = session?.user?.tenantId;
      if (!tenantId) throw new Error("Unauthorized");

      const prisma = prismaWithTenant(tenantId);

      const user = await prisma.user.update({
        where: { id: userId },
        data: { role: newRole },
      });

      revalidatePath(`/${tenantId}/settings/team`);
      return { success: true, user };
    }
  );
}

// ─── Get Permissions for Tenant ─────────────────────────────

export async function getPermissions(tenantId: string) {
  return await withAuth(
    'settings:read',
    tenantId,
    async () => {
      const prisma = prismaWithTenant(tenantId);

      return await prisma.permission.findMany({
        where: { tenantId },
        orderBy: { action: 'asc' }
      });
    }
  );
}

// ─── Update Permission ──────────────────────────────────────

export async function updatePermission(
  tenantId: string,
  action: string,
  role: Role,
  enabled: boolean
) {
  return await withAuth(
    'settings:write',
    tenantId,
    async () => {
      const prisma = prismaWithTenant(tenantId);

      if (enabled) {
        // Create or update permission
        await prisma.permission.upsert({
          where: {
            action_role_tenantId: {
              action,
              role,
              tenantId,
            },
          },
          update: {},
          create: {
            action,
            role,
            tenantId,
          },
        });
      } else {
        // Remove permission
        await prisma.permission.deleteMany({
          where: {
            action_role_tenantId: {
              action,
              role,
              tenantId,
            },
          },
        });
      }

      revalidatePath(`/${tenantId}/settings/team`);
      return { success: true };
    }
  );
}

// ─── Seed Default Permissions ──────────────────────────────

export async function seedDefaultPermissions(tenantId: string) {
  return await withAuth(
    'settings:write',
    tenantId,
    async () => {
      const { seedDefaultPermissions: seed } = await import('@axis/core/lib/auth/guard');
      const result = await seed(tenantId);
      revalidatePath(`/${tenantId}/settings/team`);
      return result;
    }
  );
}
