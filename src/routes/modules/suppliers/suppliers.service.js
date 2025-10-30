// modules/suppliers/supplierService.js
const { SupplierRepository } = require('./suppliers.repository');

// SupplierService contains the business logic for suppliers.
// It interacts with SupplierRepository for all database actions.
const SupplierService = {
  // Returns a list of all suppliers
  list: () => SupplierRepository.findAll(),

  // Retrieves a supplier by id
  get: (idSupplier) => SupplierRepository.findById(idSupplier),

  // Creates a new supplier
  create: async (data) => {
    try {
      // Default taxId if not provided
      if (!data.taxId || data.taxId.trim() === '') {
        data.taxId = '0-000-000000';
      }

      return await SupplierRepository.create(data);
    } catch (error) {
      console.error('[SUPPLIER] create error:', error);
      throw error;
    }
  },

  // Updates a supplier by id
  update: async (idSupplier, data) => {
    try {
      // Apply default taxId if sending empty
      if (data.taxId !== undefined && (!data.taxId || data.taxId.trim() === '')) {
        data.taxId = '0-000-000000';
      }

      return await SupplierRepository.update(idSupplier, data);
    } catch (error) {
      console.error('[SUPPLIER] update error:', error);
      throw error;
    }
  },

  // Soft deletes a supplier by id (marks as inactive)
  softDelete: async (idSupplier) => {
    return await SupplierRepository.update(idSupplier, { status: 'inactive' });
  }
};

// Export the service for use in controllers
module.exports = { SupplierService };
