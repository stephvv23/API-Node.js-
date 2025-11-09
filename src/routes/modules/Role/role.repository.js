// Repository for Role entity. Handles all database operations using Prisma.
let prisma = require('../../../lib/prisma.js');

const baseSelect = {
    idRole: true,
    rolName: true,
    status: true
};

const roleRepository = {

    // List roles, optionally filtered by status, with pagination.
    list: () => {
        return prisma.role.findMany({
            orderBy: {
                rolName: 'asc'
            },
            select: baseSelect,
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
    update: (id, data) => {
        const roleId = Number(id);
        
        // Prevent modification of admin role (idRole: 1)
        if (roleId === 1) {
            throw new Error('no se puede modificar el role admin');
        }
        
        return prisma.role.update({
            where: { idRole: roleId },
            data: {
                rolName: data.rolName,
                status: data.status
            },
            select: baseSelect,
        });
    },
    // Soft-delete a role (set status to 'inactive').
    delete: (id) => {
        const roleId = Number(id);
        
        // Prevent deletion of admin role (idRole: 1)
        if (roleId === 1) {
            throw new Error('Cannot delete admin role');
        }
        
        return prisma.role.update({
            where: { idRole: roleId },
            data: { status: 'inactive' },
            select: baseSelect,
        });
    },
};

module.exports = { roleRepository };
