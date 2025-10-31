
let prisma = require('../../../lib/prisma.js'); // Import Prisma client

// Define a reusable 'select' object to specify which fields to return
// This prevents repeating field selections across multiple queries
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

  // Nested relationship: Supplier → CategorySupplier → Category
  categorySupplier: {
    select: {
      idCategory: true,
      idSupplier: true,
      category: {
        select: {
          idCategory: true,
          name: true,
          status: true
        }
      }
    }
  },

  // Nested relationship: Supplier → CategorySupplier → Category
  headquarterSupplier: {
    select: {
      idHeadquarter: true,
      idSupplier: true,
      headquarter: {
        select: {
          idHeadquarter: true,
          name: true,
          status: true,
          location: true,
          email: true
        }
      }
    }
  },

  // Nested relationship: Supplier → PhoneSupplier → Phone
  phoneSupplier: {
    select: {
      idPhone: true,
      idSupplier: true,
      phone: {
        select: {
          idPhone: true,
          phone: true
        }
      }
    }
  }
};

// SupplierRepository encapsulates all database operations related to suppliers
const SupplierRepository = {

  // List all suppliers (active and inactive)
  list: () => {
    return prisma.supplier.findMany({
      select: baseSelect,
      orderBy: { name: 'asc' }
    });
  },

  // Find supplier by ID
  findById: (id) =>
    prisma.supplier.findUnique({
      where: { idSupplier: Number(id) },
      select: baseSelect
    }),

  // Find supplier by name
  findByName: (name) =>
    prisma.supplier.findFirst({
      where: { name },
      select: baseSelect
    }),

  // Find supplier by email
  findByEmail: (email) =>
    prisma.supplier.findFirst({
      where: { email },
      select: baseSelect
    }),

  // Create a new supplier
  create: (data) =>
    prisma.supplier.create({
      data,
      select: baseSelect
    }),

  // Update an existing supplier
  update: (id, data) =>
    prisma.supplier.update({
      where: { idSupplier: Number(id) },
      data,
      select: baseSelect
    }),

  // Soft delete: set status to 'inactive'
  remove: (id) =>
    prisma.supplier.update({
      where: { idSupplier: Number(id) },
      data: { status: 'inactive' },
      select: baseSelect
    })
};

module.exports = { SupplierRepository }; // Export the SupplierRepository
