// Repository for Category entity. Handles all database operations using Prisma.
let prisma = require('../../../lib/prisma.js');

const baseSelect = {
    idCategory: true,
    name: true,
    status: true
};

const categoryRepository = {

    // List categories, optionally filtered by status, with pagination.
    list: async () => {
        return prisma.category.findMany({
            orderBy: {
                name: 'asc'
            },
            select: baseSelect,
        });
    },
    // Get a category by its ID.
    getById: (id) =>
        prisma.category.findUnique({
            where: { idCategory: Number(id) },
            select: baseSelect
        }),
    // Find a category by its name.
    findByName: (name) =>
        prisma.category.findUnique({
            where: { name: name },
            select: baseSelect
        }),
    // Create a new category.
    create: (data) =>
        prisma.category.create({
            data: {
                name: data.name,
                status: data.status || "active"
            },
            select: baseSelect,
        }),
    // Update a category by ID.
    update: async (id, data) => {
        try {
            return await prisma.category.update({
                where: { idCategory: Number(id) },
                data,
                select: baseSelect,
            });
        } catch (e) {
            if (e?.code === 'P2025') return null;
            throw e;
        }
    },

    // Soft-delete a category (set status to 'inactive').
    delete: (id) =>
        prisma.category.update({
            where: { idCategory: Number(id) },
            data: { status: 'inactive' },
            select: baseSelect,
        }),
};

module.exports = { categoryRepository };