let prisma = require('../../../lib/prisma.js');

const baseSelect = {
    idRole: true,
    idWindow: true,
    create: true,
    read: true,
    update: true,
    delete: true
};

const baseWindow = {
    idWindow: true,
    windowName: true,
    status: true
}

const roleWindowRepository = {
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

    list: ({take = 100, skip = 0} = {}) => {
        return prisma.roleWindow.findMany({
            select: baseSelect,
            take, 
            skip,
        });
    },
    getByIds: (idRole, idWindow) =>
        prisma.roleWindow.findUnique({
        where: {
            idRole_idWindow: {   
            idRole: Number(idRole),
            idWindow: Number(idWindow),
            }
        }
        }),
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
    // roleWindows.repository.js
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