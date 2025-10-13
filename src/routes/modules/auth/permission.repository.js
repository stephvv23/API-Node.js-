// src/routes/modules/auth/permission.repository.js
const prisma = require("../../../lib/prisma.js");

const PermissionRepository = {
  async getWindowsForUser(email) {
    // 1️⃣ Buscar los roles del usuario
    const roles = await prisma.userRole.findMany({
      where: { email },
      select: { idRole: true },
    });

    const roleIds = roles.map((r) => r.idRole);
    if (roleIds.length === 0) return [];

    // 2️⃣ Buscar las ventanas asociadas a esos roles
    const rows = await prisma.roleWindow.findMany({
      where: { idRole: { in: roleIds } },
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

    // 3️⃣ Agrupar por ventana (fusionar permisos si tiene varios roles)
    const combined = new Map();

    for (const r of rows) {
      const w = r.window;
      const key = w.idWindow.toString(); // Usar idWindow como clave única

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

    return Array.from(combined.values());
  },
};

module.exports = { PermissionRepository };
