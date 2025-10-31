
const { SupplierService } = require('./suppliers.service');
const { SecurityLogService } = require('../../../services/securitylog.service');
const { EntityValidators } = require('../../../utils/validator');
let prisma = require('../../../lib/prisma.js');

// Helper function to format logs
const formatField = (field) => field || 'N/A';

const SupplierController = {
  // List all suppliers
  getAll: async (req, res, next) => {
    try {
      const suppliers = await SupplierService.list();
      return res.success(suppliers);
    } catch (error) {
      console.error('[SUPPLIERS] getAll error:', error);
      return res.error('Error al obtener los proveedores');
    }
  },

  // Get supplier by ID
  getById: async (req, res) => {
    const { id } = req.params;
    try {
      const supplier = await SupplierService.findById(id);
      if (!supplier) return res.notFound('Proveedor');
      return res.success(supplier);
    } catch (error) {
      console.error('[SUPPLIERS] getById error:', error);
      return res.error('Error al obtener el proveedor');
    }
  },

  // Create new supplier
  create: async (req, res) => {
    const { name, taxId, type, email, address, paymentTerms, description, status } = req.body;

    // Validation
    const validation = EntityValidators.supplier(
      { name, taxId, type, email, address, paymentTerms, description, status },
      { partial: false }
    );

    if (!validation.isValid) return res.validationErrors(validation.errors);

    try {
      // Check duplicates
      const allSuppliers = await SupplierService.list();
      const duplicateErrors = [];
      if (allSuppliers.some(s => s.name === name)) duplicateErrors.push('Ya existe un proveedor con ese nombre');
      if (allSuppliers.some(s => s.email === email)) duplicateErrors.push('Ya existe un proveedor con ese correo');
      if (duplicateErrors.length > 0) return res.validationErrors(duplicateErrors);

      const newSupplier = await SupplierService.create({ name, taxId, type, email, address, paymentTerms, description, status });

      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'CREATE',
        description: `Se creó el proveedor: ID: "${newSupplier.idSupplier}", Nombre: "${newSupplier.name}", Email: "${newSupplier.email}", Tipo: "${newSupplier.type}", Dirección: "${newSupplier.address}", Términos de pago: "${newSupplier.paymentTerms}", Descripción: "${newSupplier.description}", Estado: "${newSupplier.status}".`,
        affectedTable: 'Supplier',
      });

      return res.status(201).success(newSupplier, 'Proveedor creado exitosamente');
    } catch (error) {
      console.error('[SUPPLIERS] create error:', error);
      return res.error('Error al crear el proveedor');
    }
  },

  // Update supplier
  update: async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const validation = EntityValidators.supplier(updateData, { partial: true });
    if (!validation.isValid) return res.validationErrors(validation.errors);

    try {
      // Check duplicates
      const duplicateErrors = [];
      if (updateData.name) {
        const existsName = await SupplierService.findByName(updateData.name);
        if (existsName && existsName.idSupplier != id) duplicateErrors.push('Ya existe un proveedor con ese nombre');
      }
      if (updateData.email) {
        const existsEmail = await SupplierService.findByEmail(updateData.email);
        if (existsEmail && existsEmail.idSupplier != id) duplicateErrors.push('Ya existe un proveedor con ese correo');
      }
      if (duplicateErrors.length > 0) return res.validationErrors(duplicateErrors);

      const previousSupplier = await SupplierService.findById(id);
      if (!previousSupplier) return res.notFound('Proveedor');

      const updatedSupplier = await SupplierService.update(id, updateData);

      const userEmail = req.user?.sub;
      const onlyStatusChange = previousSupplier.status === 'inactive' && updatedSupplier.status === 'active' &&
        previousSupplier.name === updatedSupplier.name &&
        previousSupplier.email === updatedSupplier.email &&
        previousSupplier.type === updatedSupplier.type &&
        previousSupplier.address === updatedSupplier.address &&
        previousSupplier.paymentTerms === updatedSupplier.paymentTerms &&
        previousSupplier.description === updatedSupplier.description;

      if (onlyStatusChange) {
        await SecurityLogService.log({
          email: userEmail,
          action: 'REACTIVATE',
          description: `Se reactivó el proveedor: ID "${id}", Nombre: "${updatedSupplier.name}", Email: "${updatedSupplier.email}", Tipo: "${updatedSupplier.type}", Dirección: "${updatedSupplier.address}", Términos de pago: "${updatedSupplier.paymentTerms}", Descripción: "${updatedSupplier.description}", Estado: "${updatedSupplier.status}".`,
          affectedTable: 'Supplier',
        });
      } else {
        await SecurityLogService.log({
          email: userEmail,
          action: 'UPDATE',
          description:
            `Se actualizó el proveedor: ID "${id}".\n` +
            `Versión previa: Nombre: "${previousSupplier.name}", Email: "${previousSupplier.email}", Tipo: "${previousSupplier.type}", Dirección: "${previousSupplier.address}", Términos de pago: "${previousSupplier.paymentTerms}", Descripción: "${previousSupplier.description}", Estado: "${previousSupplier.status}".\n` +
            `Nueva versión: Nombre: "${updatedSupplier.name}", Email: "${updatedSupplier.email}", Tipo: "${updatedSupplier.type}", Dirección: "${updatedSupplier.address}", Términos de pago: "${updatedSupplier.paymentTerms}", Descripción: "${updatedSupplier.description}", Estado: "${updatedSupplier.status}".`,
          affectedTable: 'Supplier',
        });
      }

      return res.success(updatedSupplier, 'Proveedor actualizado exitosamente');
    } catch (error) {
      console.error('[SUPPLIERS] update error:', error);
      return res.error('Error al actualizar el proveedor');
    }
  },

  // Delete (inactivate) supplier
  delete: async (req, res) => {
    const { id } = req.params;

    const exists = await SupplierService.findById(id);
    if (!exists) return res.notFound('Proveedor');

    try {
      const deletedSupplier = await SupplierService.remove(id);
      const userEmail = req.user?.sub;

      await SecurityLogService.log({
        email: userEmail,
        action: 'INACTIVE',
        description: `Se inactivó el proveedor: ID "${id}", Nombre: "${deletedSupplier.name}", Email: "${deletedSupplier.email}", Tipo: "${deletedSupplier.type}", Dirección: "${deletedSupplier.address}", Términos de pago: "${deletedSupplier.paymentTerms}", Descripción: "${deletedSupplier.description}", Estado: "${deletedSupplier.status}".`,
        affectedTable: 'Supplier',
      });

      return res.success(deletedSupplier, 'Proveedor inactivado exitosamente');
    } catch (error) {
      console.error('[SUPPLIERS] delete error:', error);
      return res.error('Error al inactivar el proveedor');
    }
  },

  // Get lookup data (categories, headquarters, etc.)
  getLookupData: async (req, res) => {
    try {
      const [categories, headquarters] = await Promise.all([
        prisma.categorySupplier.findMany({ orderBy: { name: 'asc' } }),
        prisma.headquarter.findMany({ orderBy: { name: 'asc' } })
      ]);

      return res.success({ categories, headquarters });
    } catch (error) {
      console.error('[SUPPLIERS] getLookupData error:', error);
      return res.error('Error al obtener los datos de referencia para proveedores');
    }
  }
};

module.exports = { SupplierController };
