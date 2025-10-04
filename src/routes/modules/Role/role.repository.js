// Repository for Role entity. Handles all database operations using Prisma.
let prisma = require('../../../lib/prisma.js');

const baseSelect = {
    idRole: true,
    rolName: true,
    status: true
};

const roleRepository = {

    // List roles, optionally filtered by status, with pagination.
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

    // Get a role by its ID.
    getById: (id) =>
        prisma.role.findUnique({
            where: { idRole: Number(id) },
            select: baseSelect
        }),
    
    // Find a role by its name.
    findByName: (rolName) =>
        prisma.role.findUnique({
            where: {rolName: rolName},
            select: baseSelect
        }),

    // Create a new role.
    create: (data) =>
        prisma.role.create({
            data: {
                rolName: data.rolName,
                status: data.status || 'active'
            },
            select: baseSelect,
        }),

    // Update a role by ID.
    update: (id, data) =>
        prisma.role.update({
            where: { idRole: Number(id) },
            data: {
            rolName: data.rolName,
            status : data.status
            },
            select: baseSelect,
        }),
    // Soft-delete a role (set status to 'inactive').
    delete: (id) => 
        prisma.role.update({
            where: {idRole: Number(id)},
            data: { status: 'inactive'},
            select: baseSelect,
        }),
};

module.exports = { roleRepository };
