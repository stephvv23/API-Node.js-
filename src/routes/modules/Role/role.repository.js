let prisma = require('../../../lib/prisma.js');

const baseSelect = {
    idRole: true,
    rolName: true,
    status: true
};

const roleRepository = {

    list: ({ status = 'active', take = 100, skip = 0 } = {} ) => {
        const where = status === 'all' ? {} : { status };
        return prisma.role.findMany({
            where, 
            select: baseSelect,
            orderBy: {
                rolName: 'asc'
            },
            take,
            skip,
        });
    },

    getById: (id) =>
        prisma.role.findUnique({
            where: { idRole: Number(id) },
            select: baseSelect
        }),

    create: (data) =>
        prisma.role.create({
            data: {
                rolName: data.rolName,
                status: data.status || 'active'
            },
            select: baseSelect,
        }),

        update: (id, data) =>
            prisma.role.update({
                where: { idRole: Number(id)},
                data: {
                    rolName: data.rolName,
                    status: data.status || 'active'
                },
                select: baseSelect,
            }),

        delete: (id) => 
            prisma.role.update({
                where: {idRole: Number(id)},
                data: { status: 'inactive'},
                select: baseSelect,
            }),
};

module.exports = { roleRepository };
