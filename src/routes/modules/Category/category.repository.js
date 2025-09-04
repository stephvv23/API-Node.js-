let prisma = require ('../../../lib/prisma.js');

const baseSelect = {
    idCategory: true,
    name: true,
    status: true
};

const categoryRepository = {

    list : ({status = 'active', take = 100, skip = 0} = {}) => {
        const where = status === 'all' ? {}: {status}; // enlistar todas las categorias
        return prisma.category.findMany({
            where,
            select: baseSelect,
            orderBy: {
                name: 'asc'
            },
            take,
            skip,
        });
    },
    getById: (id) => 
        prisma.category.findUnique({
            where: { idCategory: Number(id) },
            select: baseSelect
        }),
    create: (data) => 
        prisma.category.create({
            data: {
                name: data.name,
                status: data.status || "active"
            },
            select : baseSelect,
        }),
    update: (id, data) => 
        prisma.category.update({
            where: {idCategory : Number(id)},
            data: {
                name: data.name,
                status: data.status || "active"
            },
            select : baseSelect,
        }),

    delete: (id) =>
        prisma.category.update({
            where: { idCategory: Number(id) },
            data: { status: 'inactive' },
            select: baseSelect,
        }),
};

module.exports = { categoryRepository };