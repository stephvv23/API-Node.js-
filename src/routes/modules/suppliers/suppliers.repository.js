// Import PrismaClient from Prisma ORM
const { PrismaClient } = require('@prisma/client');

// Create a Prisma client instance to interact with the database
const prisma = new PrismaClient();

// Define a reusable selection of fields for queries
// (Ensures only these properties are returned from the database)
const baseSelect = {
  idSupplier: true,
  name: true,
  taxId: true,
  type: true,
  email: true,
  address: true,
  paymentTerms: true,
  description: true,
  status: true,
};

const SupplierRepository = {
  // Finds all suppliers
  findAll: async () => {
    return await prisma.supplier.findMany({
      select: baseSelect,
    });
  },

  // Finds a single supplier by ID
  findById: (idSupplier) =>
    prisma.supplier.findUnique({
      where: { idSupplier: Number(idSupplier) },
      select: baseSelect,
    }),

  // Creates a new supplier
  create: (data) =>
    prisma.supplier.create({
      data,
      select: baseSelect,
    }),

  // Updates a supplier by ID
  update: (idSupplier, data) =>
    prisma.supplier.update({
      where: { idSupplier: Number(idSupplier) },
      data,
      select: baseSelect,
    }),

  // Removes a supplier by ID
  remove: async (idSupplier) => {
    try {
      await prisma.supplier.delete({
        where: { idSupplier: Number(idSupplier) },
      });
      return true; // Deletion was successful
    } catch (error) {
      if (error.code === 'P2025') {
        // Record does not exist
        return false;
      }
      throw error; // Unexpected errors
    }
  },
};

module.exports = { SupplierRepository };
