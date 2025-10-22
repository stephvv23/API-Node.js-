const prisma = require("../../../lib/prisma.js");

const PermissionRepository = {
  async getWindowsForUser(email) {
    
    // First, let's check ALL roles for this user (without filtering by status)
    const allUserRoles = await prisma.userRole.findMany({
      where: { email },
      include: { role: true }
    });
    
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


    const roleIds = roles.map((r) => r.idRole);
    if (roleIds.length === 0) {
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
    return result;
  },
};

module.exports = { PermissionRepository };
