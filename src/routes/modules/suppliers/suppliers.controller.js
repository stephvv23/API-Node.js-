const { SupplierService } = require('./suppliers.service');
const { EntityValidators } = require('../../../utils/validator');

/**
 * SupplierController handles HTTP requests for suppliers.
 * All responses use standardized helpers (res.success, res.error, etc.)
 * Validation is performed using EntityValidators.supplier.
 */
const SupplierController = {
  /**
   * List all suppliers
   * GET /suppliers
   */
  list: async (_req, res) => {
    try {
      const suppliers = await SupplierService.list();
      return res.success(suppliers);
    } catch (error) {
      console.error('[SUPPLIER] list error:', error);
      return res.error('Error retrieving suppliers');
    }
  },

  /**
   * Get a single supplier by ID
   * GET /suppliers/:idSupplier
   */
  get: async (req, res) => {
    const { idSupplier } = req.params;
    const id = Number(idSupplier);

    if (!Number.isInteger(id) || id <= 0) {
      return res.validationErrors(['idSupplier must be a positive integer']);
    }

    try {
      const supplier = await SupplierService.get(id);
      if (!supplier) {
        return res.notFound('Supplier');
      }
      return res.success(supplier);
    } catch (error) {
      console.error('[SUPPLIER] get error:', error);
      return res.error('Error retrieving supplier');
    }
  },

  /**
   * Create a new supplier
   * POST /suppliers
   */
  create: async (req, res) => {
    const data = req.body;

    // Validate input (all required fields)
    const validation = EntityValidators.supplier(data, { partial: false });
    const errors = [...validation.errors];

    if (errors.length > 0) {
      return res.validationErrors(errors);
    }

    try {
      const newSupplier = await SupplierService.create(data);
      return res.status(201).success(newSupplier, 'Supplier created successfully');
    } catch (error) {
      console.error('[SUPPLIER] create error:', error);
      return res.error('Error creating supplier');
    }
  },

  /**
   * Update an existing supplier by ID
   * PUT /suppliers/:idSupplier
   */
  update: async (req, res) => {
    const { idSupplier } = req.params;
    const id = Number(idSupplier);

    if (!Number.isInteger(id) || id <= 0) {
      return res.validationErrors(['idSupplier must be a positive integer']);
    }

    // Partial validation for updates
    const validation = EntityValidators.supplier(req.body, { partial: true });
    const errors = [...validation.errors];

    if (errors.length > 0) {
      return res.validationErrors(errors);
    }

    try {
      const exists = await SupplierService.get(id);
      if (!exists) {
        return res.notFound('Supplier');
      }

      const updated = await SupplierService.update(id, req.body);
      return res.success(updated, 'Supplier updated successfully');
    } catch (error) {
      if (error.code === 'P2025') {
        return res.notFound('Supplier');
      }
      console.error('[SUPPLIER] update error:', error);
      return res.error('Error updating supplier');
    }
  },

  /**
   * Soft delete a supplier by ID
   * DELETE /suppliers/:idSupplier
   */
  delete: async (req, res) => {
    const { idSupplier } = req.params;
    const id = Number(idSupplier);

    if (!Number.isInteger(id) || id <= 0) {
      return res.validationErrors(['idSupplier must be a positive integer']);
    }

    try {
      const exists = await SupplierService.get(id);
      if (!exists) {
        return res.notFound('Supplier');
      }

      const deleted = await SupplierService.softDelete(id);
      return res.success(deleted, 'Supplier deleted successfully');
    } catch (error) {
      if (error.code === 'P2025') {
        return res.notFound('Supplier');
      }
      console.error('[SUPPLIER] delete error:', error);
      return res.error('Error deleting supplier');
    }
  },
};

// Export the controller for use in routes
module.exports = { SupplierController };
