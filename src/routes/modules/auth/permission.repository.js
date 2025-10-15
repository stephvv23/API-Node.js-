const prisma = require("../../../lib/prisma.js");

const PermissionRepository = {
  async getWindowsForUser(email) {
    console.log(`[DEBUG] Getting windows for user: ${email}`);
    
    // First, let's check ALL roles for this user (without filtering by status)
    const allUserRoles = await prisma.userRole.findMany({
      where: { email },
      include: { role: true }
    });
    console.log(`[DEBUG] ALL roles for user (no filter):`, JSON.stringify(allUserRoles, null, 2));
    
    // search active roles for that user
    const roles = await prisma.userRole.findMany({
      where: { 
        email,
        role: {
          status: 'active' // Only include active roles
        }
      },
      select: { idRole: true, role: { select: { idRole: true, rolName: true, status: true } } },
    });

    console.log(`[DEBUG] Roles query result (filtered by active):`, JSON.stringify(roles, null, 2));

    const roleIds = roles.map((r) => r.idRole);
    if (roleIds.length === 0) {
      console.log(`[DEBUG] No active roles found for user ${email}`);
      return [];
    }

    // search windows for those active roles, only including active windows
    const rows = await prisma.roleWindow.findMany({
      where: { 
        idRole: { in: roleIds },
        window: {
          status: 'active' // Only include active windows
        }
      },
      select: {
        read: true,
        create: true,
        update: true,
        delete: true,
        window: {
          select: {
            idWindow: true,
            windowName: true,
            status: true,
          },
        },
      },
    });

    console.log(`[DEBUG] Windows query result:`, JSON.stringify(rows, null, 2));

    // merge permissions for the same window
    const combined = new Map();

    for (const r of rows) {
      const w = r.window;
      const key = w.idWindow.toString();

      const prev = combined.get(key) || {
        idWindow: w.idWindow,
        windowName: w.windowName,
        status: w.status,
        read: false,
        create: false,
        update: false,
        delete: false,
      };

      combined.set(key, {
        ...prev,
        read: prev.read || r.read,
        create: prev.create || r.create,
        update: prev.update || r.update,
        delete: prev.delete || r.delete,
      });
    }

    const result = Array.from(combined.values());
    console.log(`[DEBUG] Final result for user ${email}:`, JSON.stringify(result, null, 2));
    return result;
  },
};

module.exports = { PermissionRepository };
