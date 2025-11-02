

const { SupplierService } = require('./suppliers.service'); // Import the SupplierService
const { SecurityLogService } = require('../../../services/securitylog.service'); // Import SecurityLogService
const { EntityValidators } = require('../../../utils/validator'); // Import EntityValidators
let prisma = require('../../../lib/prisma.js'); // Import Prisma client

// Helper function to format logs
const formatField = (field) => field || 'N/A';

// SupplierController handles HTTP requests related to suppliers
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

    const { id } = req.params; // Extract supplier ID from request parameters

    // Validate that ID is a number
      if(isNaN(Number(id))) {
        return res.validationErrors(['El id del proveedor debe ser un número válido']);
      }

    try {

      // Fetch supplier by ID
      const supplier = await SupplierService.findById(id);

      // If supplier not found, return 404
      if (!supplier) return res.notFound('Proveedor');

      // Return supplier data
      return res.success(supplier);
    } catch (error) {

      // Log and return error response
      console.error('[SUPPLIERS] getById error:', error);
      return res.error('Error al obtener el proveedor');
    }
  },

  // Create new supplier
  create: async (req, res) => {
    let { name, taxId, type, email, address, paymentTerms, description, status } = req.body;

    // Trim input fields and eliminate extra spaces
    name = name?.trim().replace(/\s+/g, ' ');;
    taxId = taxId?.trim().replace(/\s+/g, ' ');;
    email = email?.trim().replace(/\s+/g, ' ');;
    type = type?.trim().replace(/\s+/g, ' ');;
    address = address?.trim().replace(/\s+/g, ' ');;
    paymentTerms = paymentTerms?.trim().replace(/\s+/g, ' ');;
    description = description?.trim().replace(/\s+/g, ' ');;
    status = status?.trim().replace(/\s+/g, ' ');;

    // Validation
    const validation = EntityValidators.supplier(
      { name, taxId, type, email, address, paymentTerms, description, status },
      { partial: false }
    );

    //if validation fails, return errors
    if (!validation.isValid) return res.validationErrors(validation.errors); 

    try {
      // Check duplicates
      const allSuppliers = await SupplierService.list(); // Fetch all suppliers to check for duplicates
      const duplicateErrors = []; // Collect duplicate errors

      // Check for name, taxID and email and if duplicates found, add to errors
      if (allSuppliers.some(s => s.name === name)) duplicateErrors.push('Ya existe un proveedor con ese nombre');
      if (allSuppliers.some(s => s.email === email)) duplicateErrors.push('Ya existe un proveedor con ese correo');
      if (allSuppliers.some(s => s.taxId === taxId)) duplicateErrors.push('Ya existe un proveedor con ese número de identificación fiscal');
      if (duplicateErrors.length > 0) return res.validationErrors(duplicateErrors);

      // Create supplier when no duplicates
      const newSupplier = await SupplierService.create({ name, taxId, type, email, address, paymentTerms, description, status });

      // Log creation action
      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'CREATE',
        description: `Se creó el proveedor: ID: "${newSupplier.idSupplier}", Nombre: "${newSupplier.name}", Número de identificación fiscal: "${newSupplier.taxId}", Tipo: "${newSupplier.type}", Email: "${newSupplier.email}", Dirección: "${newSupplier.address}", Términos de pago: "${newSupplier.paymentTerms}", Descripción: "${newSupplier.description}", Estado: "${newSupplier.status}".`,
        affectedTable: 'Supplier',
      });

      // Return success response
      return res.status(201).success(newSupplier, 'Proveedor creado exitosamente'); 

      //If error occurs while creating supplier
    } catch (error) {
      console.error('[SUPPLIERS] create error:', error);
      return res.error('Error al crear el proveedor');
    }
  },

  // Update supplier
  update: async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    if(isNaN(Number(id))) {
      return res.validationErrors(['El id del proveedor debe ser un número válido']);
    }

    // Validate input data (partial mode for updates)
    const validation = EntityValidators.supplier(updateData, { partial: true }); 
    if (!validation.isValid) return res.validationErrors(validation.errors);

    try {
      
      // Fetch previous supplier data for logging
      const previousSupplier = await SupplierService.findById(id);
      if (!previousSupplier) return res.notFound('Proveedor');

      // Check for duplicates if name, email, or taxId are being updated
      const duplicateErrors = [];

      //Check for name duplicates
      if (updateData.name) {
        const existsName = await SupplierService.findByName(updateData.name);
        if (existsName && Number(existsName.idSupplier) !== Number(id)) duplicateErrors.push('Ya existe un proveedor con ese nombre');
      }

      //Check for email duplicates
      if (updateData.email) {
        const existsEmail = await SupplierService.findByEmail(updateData.email);
        if (existsEmail && Number(existsEmail.idSupplier) !== Number(id)) duplicateErrors.push('Ya existe un proveedor con ese correo');
      }

      //Check for taxId duplicates
      if (updateData.taxId) {
        const existsTaxId = await SupplierService.findByTaxId(updateData.taxId);
        if (existsTaxId && Number(existsTaxId.idSupplier) !== Number(id)) duplicateErrors.push('Ya existe un proveedor con ese número de identificación fiscal');
      }

      //Return validation errors if any duplicates found
      if (duplicateErrors.length > 0) return res.validationErrors(duplicateErrors);

      // Proceed to update supplier
      const updatedSupplier = await SupplierService.update(id, updateData);

      // Log update action that details previous and new values
      const userEmail = req.user?.sub;

      // Check if status changed from inactive to active
      const onlyStatusChange = previousSupplier.status === 'inactive' && updatedSupplier.status === 'active' &&
        previousSupplier.name === updatedSupplier.name &&
        previousSupplier.email === updatedSupplier.email &&
        previousSupplier.type === updatedSupplier.type &&
        previousSupplier.address === updatedSupplier.address &&
        previousSupplier.paymentTerms === updatedSupplier.paymentTerms &&
        previousSupplier.description === updatedSupplier.description;

       // If only status changed from inactive to active, log as REACTIVATE 
      if (onlyStatusChange) {
        await SecurityLogService.log({
          email: userEmail,
          action: 'REACTIVATE',
          description: `Se reactivó el proveedor: ID: "${newSupplier.idSupplier}", Nombre: "${newSupplier.name}", Número de identificación fiscal: "${newSupplier.taxId}", Tipo: "${newSupplier.type}", Email: "${newSupplier.email}", Dirección: "${newSupplier.address}", Términos de pago: "${newSupplier.paymentTerms}", Descripción: "${newSupplier.description}", Estado: "${newSupplier.status}".`,
          affectedTable: 'Supplier',
        });

        // Otherwise, log as UPDATE with detailed changes
      } else {
        await SecurityLogService.log({
          email: userEmail,
          action: 'UPDATE',
          description:
            `Se actualizó el proveedor: ID "${id}".\n` +
            `Versión previa: Nombre: "${previousSupplier.name}", Numero de identificación fiscal: "${previousSupplier.taxId}", Tipo: "${previousSupplier.type}", Email: "${previousSupplier.email}", Dirección: "${previousSupplier.address}", Términos de pago: "${previousSupplier.paymentTerms}", Descripción: "${previousSupplier.description}", Estado: "${previousSupplier.status}".\n` +
            `Nueva versión: Nombre: "${previousSupplier.name}", Numero de identificación fiscal: "${previousSupplier.taxId}", Tipo: "${previousSupplier.type}", Email: "${previousSupplier.email}", Dirección: "${previousSupplier.address}", Términos de pago: "${previousSupplier.paymentTerms}", Descripción: "${previousSupplier.description}", Estado: "${previousSupplier.status}".`,
          affectedTable: 'Supplier',
        });
      }

      // Return success response
      return res.success(updatedSupplier, 'Proveedor actualizado exitosamente');
    } catch (error) {
      console.error('[SUPPLIERS] update error:', error);
      return res.error('Error al actualizar el proveedor');
    }
  },

  // Delete (inactivate) supplier
  delete: async (req, res) => {

    // Extract supplier ID from request parameters
    const { id } = req.params;

    // Validate that ID is a number
    if(isNaN(Number(id))) {
      return res.validationErrors(['El id del proveedor debe ser un número válido']);
    }

    // Check if supplier exists by id before attempting deletion
    const exists = await SupplierService.findById(id);
    if (!exists) return res.notFound('Proveedor');

    //If supplier exists, proceed to inactivate
    try {
      const deletedSupplier = await SupplierService.remove(id); // Soft delete (inactivate) supplier
      const userEmail = req.user?.sub; // Get user email for logging

      // Log inactivation action
      await SecurityLogService.log({
        email: userEmail,
        action: 'INACTIVE',
        description: `Se inactivó el proveedor: ID "${id}", Nombre: "${deletedSupplier.name}", Número de identificación fiscal: "${deletedSupplier.taxId}", Tipo: "${deletedSupplier.type}", Email: "${deletedSupplier.email}", Dirección: "${deletedSupplier.address}", Términos de pago: "${deletedSupplier.paymentTerms}", Descripción: "${deletedSupplier.description}", Estado: "${deletedSupplier.status}".`,
        affectedTable: 'Supplier',
      });

      // Return success response
      return res.success(deletedSupplier, 'Proveedor inactivado exitosamente'); 

      //If does not exist or error occurs while deleting supplier
    } catch (error) {
      console.error('[SUPPLIERS] delete error:', error);
      return res.error('Error al inactivar el proveedor');
    }
  },

  // Get lookup data (categories, headquarters, etc.)
  getLookupData: async (req, res) => {
      try {
        
      // Fetch related lookup data in parallel
      const [categories, headquarters, phones] = await Promise.all([

        // Categories related to suppliers
        prisma.categorySupplier.findMany({
          orderBy: {
            category: { name: 'asc' } // Order by category.name
          },
          select: {
            idCategory: true,
            idSupplier: true,
            category: {
              select: { idCategory: true, name: true, status: true }
            }
          }
        }),

        // Headquarters related to suppliers
        prisma.headquarterSupplier.findMany({
          orderBy: {
            headquarter: { name: 'asc' } // Order by headquarter.name
          },
          select: {
            idHeadquarter: true,
            idSupplier: true,
            headquarter: {
              select: { idHeadquarter: true, name: true, status: true, location: true, email: true }
            }
          }
        }),

        // Phones related to suppliers
        prisma.phoneSupplier.findMany({
          orderBy: {
            phone: { phone: 'asc' } // Order by phone.phone
          },
          select: {
            idPhone: true,
            idSupplier: true,
            phone: {
              select: { idPhone: true, phone: true }
            }
          }
        })
      ]);

      return res.success({ categories, headquarters, phones });
    } catch (error) {
      console.error('[SUPPLIERS] getLookupData error:', error);
      return res.error('Error al obtener los datos de referencia para proveedores');
    }
  },

  
};//End of SupplierController

// Export the SupplierController
module.exports = { SupplierController };
