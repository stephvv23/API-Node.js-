
const { SupplierRepository } = require('./suppliers.repository');



const SupplierService = {
  // List all suppliers (active and inactive)
  list: async () => {
    return SupplierRepository.list();
  },

  // Retrieves a supplier by id
  findById: async (id) => {
    return SupplierRepository.findById(id);
  },

  // Retrieves a supplier by name
  findByName: async (name) => {
    return SupplierRepository.findByName(name);
  },

  // Retrieves a supplier by email
  findByEmail: async (email) => {
    return SupplierRepository.findByEmail(email);
  },

  // Retrieves a supplier by tax ID
  findByTaxId: async (taxId) => {
    return SupplierRepository.findByTaxId(taxId);
  },

  // Creates a new supplier
  create: async (data) => {
    return SupplierRepository.create({
      name: data.name,
      taxId: data.taxId,
      type: data.type,
      email: data.email,
      address: data.address,
      paymentTerms: data.paymentTerms,
      description: data.description,
      status: data.status || 'active'
    });
  },

  // Updates supplier data by id
  update: async (id, data) => {
    // Filter out relationship fields that are handled separately
    const { categorySupplier, headquarterSupplier, phoneSupplier, ...updateData } = data;

    // Filter to only include valid supplier fields
    const validFields = ['name', 'taxId', 'type', 'email', 'address', 'paymentTerms', 'description', 'status'];
    const filteredUpdateData = {};
    for (const field of validFields) {
      if (updateData[field] !== undefined) {
        filteredUpdateData[field] = updateData[field];
      }
    }

    // Update the supplier with filtered data
    return SupplierRepository.update(id, filteredUpdateData);
  },

  // Updates only the supplier status by id
  updateStatus: async (id, status) => {
    return SupplierRepository.update(id, { status });
  },

  // Deletes a supplier by id (soft delete)
  remove: async (id) => {
    return SupplierRepository.update(id, { status: 'inactive' });
  },
};

module.exports = { SupplierService }; // Export the SupplierService
