// Repository for RoleWindow entity. Handles all database operations using Prisma.
let prisma = require('../../../lib/prisma.js');

// Base select fields for RoleWindow
const baseSelect = {
    idRole: true,
    idWindow: true,
    create: true,
    read: true,
    update: true,
    delete: true
};

// Base select fields for Window
const baseWindow = {
    idWindow: true,
    windowName: true,
    status: true
}

const roleWindowRepository = {
    // List windows, optionally filtered by status, with pagination
    listWindows : ({
        status = 'active', 
        take = 100,
        skip = 0
    } = {}) => {
        const where = status === 'all' ? {}: {status};
        return prisma.window.findMany({
            where: {
                ...where,
                NOT: {
                    idWindow: 5 
                }
            },
            select: baseWindow,
            orderBy: {
                windowName: 'asc'
            },
            take,
            skip,
        });
    },

    // List role-window permissions, with pagination
    list: ({take = 100, skip = 0} = {}) => {
        return prisma.roleWindow.findMany({
            select: baseSelect,
            take, 
            skip,
        });
    },

    // Get a role-window permission by composite IDs
    getByIds: (idRole, idWindow) =>
        prisma.roleWindow.findUnique({
        where: {
            idRole_idWindow: {   
            idRole: Number(idRole),
            idWindow: Number(idWindow),
            }
        }
        }),

    // Get all windows with permissions for a given role
    getByIdRole: async (idRole) => {
        const roleId = Number(idRole);

        const windows = await prisma.window.findMany({
            where: { 
                status: 'active',
                NOT: {
                    idWindow: 5 // Exclude PrincipalPage
                }
            },
            select: {
            idWindow: true,
            windowName: true,
            roles: {
                where: { idRole: roleId },
                select: { create: true, read: true, update: true, delete: true },
                take: 1,
            },
            },
            orderBy: { windowName: 'asc' },
        });

        return windows.map(w => {
            const perms = w.roles[0];
            return {
            idWindow: w.idWindow,
            name: w.windowName,
            create: perms?.create ?? false,
            read:   perms?.read   ?? false,
            update: perms?.update ?? false,
            remove: perms?.delete ?? false, 
            };
        });
        },


    // Create or update (upsert) a role-window permission
    create: async (data) => {
        const idRole = Number(data.idRole);
        const idWindow = Number(data.idWindow);
        
        // Prevent modification of admin role (idRole: 1)
        if (idRole === 1) {
            throw new Error('no se pueden modificar los permisos del rol administrador');
        }
        
        // Try to find existing record
        const existing = await prisma.roleWindow.findUnique({
            where: {
                idRole_idWindow: {
                    idRole,
                    idWindow,
                }
            }
        });

        const permissionData = {
            create: data.create,
            read: data.read,
            update: data.update,
            delete: data.remove,
        };

        if (existing) {
            // Update existing
            return prisma.roleWindow.update({
                where: {
                    idRole_idWindow: {
                        idRole,
                        idWindow,
                    }
                },
                data: permissionData,
                select: baseSelect,
            });
        } else {
            // Create new
            return prisma.roleWindow.create({
                data: {
                    idRole,
                    idWindow,
                    ...permissionData,
                },
                select: baseSelect,
            });
        }
    },

    // Update a role-window permission (or create if not exists)
    update: async (idRole, idWindow, flags) => {
        // Prevent modification of admin role (idRole: 1)
        if (Number(idRole) === 1) {
            throw new Error('no se pueden modificar los permisos del rol administrador');
        }

        const existing = await prisma.roleWindow.findUnique({
            where: {
                idRole_idWindow: { idRole, idWindow },
            }
        });

        const permissionData = {
            create: flags.create,
            read: flags.read,
            update: flags.update,
            delete: flags.remove,
        };

        if (existing) {
            // Update existing
            return prisma.roleWindow.update({
                where: {
                    idRole_idWindow: { idRole, idWindow },
                },
                data: permissionData,
                select: baseSelect,
            });
        } else {
            // Create new
            return prisma.roleWindow.create({
                data: {
                    idRole,
                    idWindow,
                    ...permissionData,
                },
                select: baseSelect,
            });
        }
    },

    // Delete a role-window permission by composite IDs
    delete: (idRole, idWindow) => {
        // Prevent deletion of admin role permissions (idRole: 1)
        if (Number(idRole) === 1) {
            throw new Error('no se pueden eliminar los permisos del rol administrador');
        }
        
        return prisma.roleWindow.delete({
            where: {
                idRole_idWindow: {   
                    idRole: Number(idRole),
                    idWindow: Number(idWindow),
                }
            }
        });
    },
    
}

module.exports = { roleWindowRepository }
