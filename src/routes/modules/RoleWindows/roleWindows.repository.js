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
            where,
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
            where: { status: 'active' },
            select: {
            idWindow: true,
            windowName: true,
            roles: {
                where: { idRole: roleId },
                select: { create: true, read: true, update: true, delete: true },
                take: 1,
            },
            },
            orderBy: { idWindow: 'asc' },
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
    create: (data) =>
        prisma.roleWindow.upsert({
            where: {
                idRole_idWindow: {
                    idRole: Number(data.idRole),
                    idWindow: Number(data.idWindow),
                }
            },
            create: {
                idRole: Number(data.idRole),
                idWindow: Number(data.idWindow),
                create: data.create,
                read: data.read,
                update: data.update,
                delete: data.remove, 
            },
            update: {
                create: data.create,
                read: data.read,
                update: data.update,
                delete: data.remove,
            },
            select: baseSelect,
        }),

    // Update a role-window permission (upsert)
    update: (idRole, idWindow, flags) =>
    prisma.roleWindow.upsert({
        where: {
            idRole_idWindow: { idRole, idWindow },
        },
        update: {
            create: flags.create,
            read:   flags.read,
            update: flags.update,
            delete: flags.remove,   
        },
        create: {
            idRole,
            idWindow,
            create: flags.create,
            read:   flags.read,
            update: flags.update,
            delete: flags.remove,
        },
        select: baseSelect,
    }),

    // Delete a role-window permission by composite IDs
    delete: (idRole, idWindow) => 
        prisma.roleWindow.delete({
            where: {
                idRole_idWindow: {   
                    idRole: Number(idRole),
                    idWindow: Number(idWindow),
                }
            }
        }),
    
}

module.exports = { roleWindowRepository }
