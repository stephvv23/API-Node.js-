
let prisma = require('../../../lib/prisma.js');

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

module.exports = { SupplierRepository };
