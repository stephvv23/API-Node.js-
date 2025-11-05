
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

  // Lists suppliers with optional status, pagination, and ordering
  list: ({ status = 'active', take = 100, skip = 0 } = {}) => {
    const where = status === 'all' ? {} : { status };
    return prisma.supplier.findMany({
      where,
      select: baseSelect,
      orderBy: {
        name: 'asc'
      },
      take,
      skip,
    });
  },

  // Lists all active suppliers
  listActive: () =>
    prisma.supplier.findMany({
      where: { status: 'active' },
      select: baseSelect
    }),

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

  // Find supplier by tax ID
  findByTaxId: (taxId) =>
    prisma.supplier.findFirst({
      where: { taxId },
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
    }),

    // ===== HEADQUARTERS RELATIONSHIPS =====

  // Fetch all headquarters linked to a specific supplier
  getHeadquarters: (idSupplier) =>
    prisma.headquarterSupplier.findMany({
      where: { idSupplier: Number(idSupplier) }, // Filter relationships by supplier ID
      include: { 
        headquarter: { select: { idHeadquarter: true, name: true } } // Include basic headquarter info
      }
    }),

  // Add a single headquarter relationship to a supplier
  addHeadquarter: (idSupplier, idHeadquarter) =>
    prisma.headquarterSupplier.create({
      data: { idSupplier: Number(idSupplier), idHeadquarter: Number(idHeadquarter) } // Insert the relationship
    }),

  // Add multiple headquarters to a supplier at once
  addHeadquarters: (idSupplier, idHeadquarters) =>
    prisma.headquarterSupplier.createMany({
      data: idHeadquarters.map(idHq => ({ 
        idSupplier: Number(idSupplier), 
        idHeadquarter: Number(idHq) 
      })), // Map IDs into the correct format
      skipDuplicates: true, // Skip duplicates automatically if they exist
    }),

  // Remove a single headquarter relationship
  removeHeadquarter: (idSupplier, idHeadquarter) =>
    prisma.headquarterSupplier.delete({
      where: { 
        idHeadquarter_idSupplier: { 
          idSupplier: Number(idSupplier), 
          idHeadquarter: Number(idHeadquarter) 
        } 
      }
    }),

  // Remove multiple headquarters from a supplier
  removeHeadquarters: (idSupplier, idHeadquarters) =>
    prisma.headquarterSupplier.deleteMany({
      where: { 
        idSupplier: Number(idSupplier), 
        idHeadquarter: { in: idHeadquarters.map(id => Number(id)) } // Filter using array of IDs
      }
    }),

  // Check if a headquarter exists and whether it is active
  headquarterExists: async (idHeadquarter) => {
    const hq = await prisma.headquarter.findUnique({
      where: { idHeadquarter: Number(idHeadquarter) },
      select: { status: true } // Only select the status field
    });
    return hq ? { exists: true, active: hq.status === 'active' } : { exists: false, active: false };
  },

  // ===== CATEGORIES RELATIONSHIPS =====

  // Fetch all categories linked to a specific supplier
  getCategories: (idSupplier) =>
    prisma.categorySupplier.findMany({
      where: { idSupplier: Number(idSupplier) },
      include: { 
        category: { select: { idCategory: true, name: true } } // Include category info
      }
    }),

  // Add a single category relationship to a supplier
  addCategory: (idSupplier, idCategory) =>
    prisma.categorySupplier.create({
      data: { idSupplier: Number(idSupplier), idCategory: Number(idCategory) }
    }),

  // Add multiple categories to a supplier
  addCategories: (idSupplier, idCategories) =>
    prisma.categorySupplier.createMany({
      data: idCategories.map(idCat => ({ 
        idSupplier: Number(idSupplier), 
        idCategory: Number(idCat) 
      })),
      skipDuplicates: true, // Automatically skip duplicates
    }),

  // Remove a single category relationship
  removeCategory: (idSupplier, idCategory) =>
    prisma.categorySupplier.delete({
      where: { 
        idCategory_idSupplier: { 
          idSupplier: Number(idSupplier), 
          idCategory: Number(idCategory) 
        } 
      }
    }),

  // Remove multiple categories from a supplier
  removeCategories: (idSupplier, idCategories) =>
    prisma.categorySupplier.deleteMany({
      where: { 
        idSupplier: Number(idSupplier), 
        idCategory: { in: idCategories.map(id => Number(id)) } // Filter using array of category IDs
      }
    }),

  // Check if a category exists and whether it is active
  categoryExists: async (idCategory) => {
    const cat = await prisma.category.findUnique({
      where: { idCategory: Number(idCategory) },
      select: { status: true } // Only retrieve status
    });
    return cat ? { exists: true, active: cat.status === 'active' } : { exists: false, active: false };
  },

  // ===== PHONES RELATIONSHIPS =====

  // Fetch all phones linked to a specific supplier
  getPhones: (idSupplier) =>
    prisma.phoneSupplier.findMany({
      where: { idSupplier: Number(idSupplier) },
      include: { phone: { select: { idPhone: true, phone: true } } } // Include phone details
    }),

  // Add a single phone relationship to a supplier
  addPhone: (idSupplier, idPhone) =>
    prisma.phoneSupplier.create({
      data: { idSupplier: Number(idSupplier), idPhone: Number(idPhone) }
    }),

  // Add multiple phones to a supplier
  addPhones: (idSupplier, idPhones) =>
    prisma.phoneSupplier.createMany({
      data: idPhones.map(idPhone => ({ 
        idSupplier: Number(idSupplier), 
        idPhone: Number(idPhone) 
      })),
      skipDuplicates: true, // Skip duplicates automatically
    }),

  // Remove a single phone relationship
  removePhone: (idSupplier, idPhone) =>
    prisma.phoneSupplier.delete({
      where: { 
        idPhone_idSupplier: { 
          idSupplier: Number(idSupplier), 
          idPhone: Number(idPhone) 
        } 
      }
    }),

  // Remove multiple phones from a supplier
  removePhones: (idSupplier, idPhones) =>
    prisma.phoneSupplier.deleteMany({
      where: { 
        idSupplier: Number(idSupplier), 
        idPhone: { in: idPhones.map(id => Number(id)) } // Filter with array of phone IDs
      }
    }),

  // Check if a phone exists
  phoneExists: async (idPhone) => {
    const phone = await prisma.phone.findUnique({
      where: { idPhone: Number(idPhone) },
      select: { idPhone: true } // Only retrieve idPhone to check existence
    });
    return phone ? { exists: true, active: true } : { exists: false, active: false };
  },

  // Create or get existing phone by phone string
  createOrGetPhone: async (phoneString) => {
    // Convert phone string to integer (remove non-numeric characters)
    const phoneNumber = parseInt(phoneString.replace(/\D/g, ''), 10);
    
    if (isNaN(phoneNumber)) {
      throw new Error(`Invalid phone number: ${phoneString}`);
    }

    // Try to find existing phone
    let phone = await prisma.phone.findFirst({
      where: { phone: phoneNumber }
    });

    // If not found, create it
    if (!phone) {
      phone = await prisma.phone.create({
        data: { phone: phoneNumber }
      });
    }

    return phone;
  }

};

module.exports = { SupplierRepository }; // Export the SupplierRepository
