

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

     if (!name && !taxId && !type && !email && !address && !paymentTerms && !description && !status) {
      return res.status(400).json({
        ok: false,
        message: 'El formato JSON no es válido o cuerpo vacío',
      });
    }

    // Trim input fields and eliminate extra spaces
    name = name?.trim().replace(/\s+/g, ' ');
    taxId = (taxId === undefined || taxId === null || taxId === '') ? "Indefinido" : taxId.trim().replace(/\s+/g, ' ');
    type = type?.trim().replace(/\s+/g, ' ');
    email = email?.trim().replace(/\s+/g, ' ');
    address = address?.trim().replace(/\s+/g, ' ');
    paymentTerms = paymentTerms?.trim().replace(/\s+/g, ' ');
    description = description?.trim().replace(/\s+/g, ' ');
    status = status?.trim().replace(/\s+/g, ' ');

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

      //It ignores 'Indefinido' taxId for duplicate check
      if (taxId !== 'Indefinido' && allSuppliers.some(s => s.taxId === taxId)) {
        duplicateErrors.push('Ya existe un proveedor con ese número de identificación fiscal');
      }
      
      //If duplicates found, return validation errors
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

    // Update supplier information
  update: async (req, res) => {
    const { id } = req.params;  // Extract supplier ID from URL parameters
    const updateData = req.body; // Extract data to update from request body

    // Validate that ID is a valid number
    if (isNaN(Number(id))) {
      return res.validationErrors(['The supplier ID must be a valid number']);
    }

    // ===== TAX ID HANDLING =====
    // If taxId is empty or null, assign the default value "Indefinido"
    if (updateData.taxId === undefined || updateData.taxId === null || updateData.taxId === '') {
      updateData.taxId = 'Indefinido';
    } else {
      // Remove spaces from taxId since the validator does not allow spaces
      updateData.taxId = updateData.taxId.trim().replace(/\s+/g, '');
    }

    // ===== TRIM AND CLEAN OTHER FIELDS =====
    // Remove extra spaces from all string fields if they exist
    if (updateData.name) updateData.name = updateData.name.trim().replace(/\s+/g, ' ');
    if (updateData.type) updateData.type = updateData.type.trim().replace(/\s+/g, ' ');
    if (updateData.email) updateData.email = updateData.email.trim().replace(/\s+/g, ' ');
    if (updateData.address) updateData.address = updateData.address.trim().replace(/\s+/g, ' ');
    if (updateData.paymentTerms) updateData.paymentTerms = updateData.paymentTerms.trim().replace(/\s+/g, ' ');
    if (updateData.description) updateData.description = updateData.description.trim().replace(/\s+/g, ' ');
    if (updateData.status) updateData.status = updateData.status.trim().replace(/\s+/g, ' ');

    // ===== VALIDATION =====
    // Perform partial validation using EntityValidators
    const validation = EntityValidators.supplier(updateData, { partial: true });
    if (!validation.isValid) return res.validationErrors(validation.errors);

    try {
      // ===== FETCH EXISTING SUPPLIER =====
      const previousSupplier = await SupplierService.findById(id); // Get current supplier data
      if (!previousSupplier) return res.notFound('Supplier');

      // ===== DUPLICATE CHECKS =====
      const duplicateErrors = [];

      // Check if name is being updated and if it already exists in another supplier
      if (updateData.name) {
        const existsName = await SupplierService.findByName(updateData.name);
        if (existsName && Number(existsName.idSupplier) !== Number(id))
          duplicateErrors.push('A supplier with this name already exists');
      }

      // Check if email is being updated and if it already exists in another supplier
      if (updateData.email) {
        const existsEmail = await SupplierService.findByEmail(updateData.email);
        if (existsEmail && Number(existsEmail.idSupplier) !== Number(id))
          duplicateErrors.push('A supplier with this email already exists');
      }

      // Check if taxId is being updated, but ignore default "Indefinido" values in duplicates
      if (updateData.taxId && updateData.taxId !== 'Indefinido') {
        const existsTaxId = await SupplierService.findByTaxId(updateData.taxId);
        if (existsTaxId && Number(existsTaxId.idSupplier) !== Number(id))
          duplicateErrors.push('A supplier with this tax ID already exists');
      }

      // If any duplicates found, return validation errors
      if (duplicateErrors.length > 0) return res.validationErrors(duplicateErrors);

      // ===== UPDATE SUPPLIER =====
      const updatedSupplier = await SupplierService.update(id, updateData);
      const userEmail = req.user?.sub; // Get current user email for logging

      // ===== LOGGING =====
      // Detect if only status changed from inactive to active
      const onlyStatusChange =
        previousSupplier.status === 'inactive' &&
        updatedSupplier.status === 'active' &&
        previousSupplier.name === updatedSupplier.name &&
        previousSupplier.email === updatedSupplier.email &&
        previousSupplier.type === updatedSupplier.type &&
        previousSupplier.address === updatedSupplier.address &&
        previousSupplier.paymentTerms === updatedSupplier.paymentTerms &&
        previousSupplier.description === updatedSupplier.description;

      // If only status changed, log as REACTIVATE
      if (onlyStatusChange) {
        await SecurityLogService.log({
          email: userEmail,
          action: 'REACTIVATE',
          description: `Supplier reactivated: ID "${updatedSupplier.idSupplier}", Name "${updatedSupplier.name}", Tax ID "${updatedSupplier.taxId}", Type "${updatedSupplier.type}", Email "${updatedSupplier.email}", Address "${updatedSupplier.address}", Payment Terms "${updatedSupplier.paymentTerms}", Description "${updatedSupplier.description}", Status "${updatedSupplier.status}".`,
          affectedTable: 'Supplier',
        });
      } else {
        // Otherwise, log as UPDATE with detailed before/after values
        await SecurityLogService.log({
          email: userEmail,
          action: 'UPDATE',
          description:
            `Supplier updated: ID "${id}".\n` +
            `Previous version: Name "${previousSupplier.name}", Tax ID "${previousSupplier.taxId}", Type "${previousSupplier.type}", Email "${previousSupplier.email}", Address "${previousSupplier.address}", Payment Terms "${previousSupplier.paymentTerms}", Description "${previousSupplier.description}", Status "${previousSupplier.status}".\n` +
            `New version: Name "${updatedSupplier.name}", Tax ID "${updatedSupplier.taxId}", Type "${updatedSupplier.type}", Email "${updatedSupplier.email}", Address "${updatedSupplier.address}", Payment Terms "${updatedSupplier.paymentTerms}", Description "${updatedSupplier.description}", Status "${updatedSupplier.status}".`,
          affectedTable: 'Supplier',
        });
      }

      // Return success response
      return res.success(updatedSupplier, 'Supplier updated successfully');
    } catch (error) {
      // Log error and return generic error message
      console.error('[SUPPLIERS] update error:', error);
      return res.error('Error updating supplier');
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

  // ===== HEADQUARTERS RELATIONSHIPS =====

  // Fetch all headquarters associated with a specific supplier
  getHeadquarters: async (req, res) => {
    const { id } = req.params; // Extract supplier ID from the request URL
    const validId = parseIdParam(id); // Validate that the supplier ID is a positive integer
    if (!validId) return res.validationErrors(['idSupplier must be a positive integer']); // Return validation error if invalid

    try {
      const supplier = await SupplierService.findById(validId); // Check if the supplier exists in the database
      if (!supplier) return res.notFound('Supplier'); // Return 404 if supplier does not exist

      // Fetch all headquarters linked to the supplier using the service layer
      const headquarters = await SupplierService.getHeadquarters(validId);

      // Return the list of headquarters as a success response
      return res.success(headquarters);
    } catch (error) {
      // Log errors for debugging and return a generic error response
      console.error('[SUPPLIERS] getHeadquarters error:', error);
      return res.error('Error fetching supplier headquarters');
    }
  },

  // Associate one or multiple headquarters with a supplier
  addHeadquarters: async (req, res) => {
    const { id } = req.params; // Extract supplier ID
    const { idHeadquarters } = req.body; // Extract the array of headquarters IDs to associate

    const validId = parseIdParam(id); // Validate supplier ID
    if (!validId) return res.validationErrors(['idSupplier must be a positive integer']);

    // Validate that input is a non-empty array of IDs
    if (!idHeadquarters || !Array.isArray(idHeadquarters) || idHeadquarters.length === 0) {
      return res.validationErrors(['A valid array of idHeadquarters must be provided']);
    }

    // Convert and validate each headquarter ID to ensure positive integers
    const validHqIds = idHeadquarters.map(hqId => {
      const validHqId = parseIdParam(hqId);
      if (!validHqId) throw new Error(`idHeadquarter ${hqId} must be a positive integer`);
      return validHqId;
    });

    try {
      // Call the service layer to add the headquarters to the supplier
      // Service handles checking for existence, activity status, and duplicates
      const result = await SupplierService.addHeadquarters(validId, validHqIds);

      // Track headquarters that were ignored because they were inactive
      const ignored = (result && Array.isArray(result.ignoredInactiveIds)) ? result.ignoredInactiveIds : [];
      if (ignored.length) res.set('X-Ignored-Ids', ignored.join(',')); // Optionally include ignored IDs in response headers

      // Prepare a message explaining what happened
      let message = 'Headquarter(s) associated with supplier successfully';
      if (ignored.length) message += `. Ignored (inactive): ${ignored.join(',')}`;
      return res.status(201).success(null, message); // Send a success response with status 201
    } catch (error) {
      console.error('[SUPPLIERS] addHeadquarters error:', error);
      // Handle specific error cases with clear messages
      if (error.message === 'Supplier not found') return res.notFound('Supplier');
      if (error.message?.includes('does not exist') || error.message?.includes('inactive')) return res.validationErrors([error.message]);
      if (error.code === 'P2002') return res.validationErrors(['One or more headquarters are already associated with the supplier']);
      return res.error('Error associating headquarters with supplier');
    }
  },

  // Remove one or multiple headquarters from a supplier
  removeHeadquarters: async (req, res) => {
    const { id } = req.params;
    const { idHeadquarters } = req.body;

    const validId = parseIdParam(id); // Validate supplier ID
    if (!validId) return res.validationErrors(['idSupplier must be a positive integer']);

    // Validate input array
    if (!idHeadquarters || !Array.isArray(idHeadquarters) || idHeadquarters.length === 0) {
      return res.validationErrors(['A valid array of idHeadquarters must be provided']);
    }

    // Validate each headquarter ID
    const validHqIds = idHeadquarters.map(hqId => {
      const validHqId = parseIdParam(hqId);
      if (!validHqId) throw new Error(`idHeadquarter ${hqId} must be a positive integer`);
      return validHqId;
    });

    try {
      // Remove the headquarters relationships using the service
      await SupplierService.removeHeadquarters(validId, validHqIds);
      return res.success(null, 'Headquarter(s) removed from supplier successfully');
    } catch (error) {
      console.error('[SUPPLIERS] removeHeadquarters error:', error);
      if (error.code === 'P2025') return res.notFound('Supplier-headquarter relationship'); // Specific error if relation not found
      return res.error('Error removing headquarters from supplier');
    }
  },

  // ===== CATEGORIES RELATIONSHIPS =====

  // Fetch all categories associated with a supplier
  getCategories: async (req, res) => {
    const { id } = req.params;
    const validId = parseIdParam(id); // Ensure supplier ID is valid
    if (!validId) return res.validationErrors(['idSupplier must be a positive integer']);

    try {
      const supplier = await SupplierService.findById(validId);
      if (!supplier) return res.notFound('Supplier'); // Return 404 if supplier does not exist

      // Fetch categories associated with the supplier
      const categories = await SupplierService.getCategories(validId);
      return res.success(categories);
    } catch (error) {
      console.error('[SUPPLIERS] getCategories error:', error);
      return res.error('Error fetching supplier categories');
    }
  },

  // Add one or multiple categories to a supplier
  addCategories: async (req, res) => {
    const { id } = req.params;
    const { idCategories } = req.body;

    const validId = parseIdParam(id); // Validate supplier ID
    if (!validId) return res.validationErrors(['idSupplier must be a positive integer']);

    // Validate input array
    if (!idCategories || !Array.isArray(idCategories) || idCategories.length === 0) {
      return res.validationErrors(['A valid array of idCategories must be provided']);
    }

    // Validate each category ID
    const validCatIds = idCategories.map(catId => {
      const validCatId = parseIdParam(catId);
      if (!validCatId) throw new Error(`idCategory ${catId} must be a positive integer`);
      return validCatId;
    });

    try {
      // Add categories via the service
      const result = await SupplierService.addCategories(validId, validCatIds);

      // Track ignored categories (inactive ones)
      const ignored = (result && Array.isArray(result.ignoredInactiveIds)) ? result.ignoredInactiveIds : [];
      if (ignored.length) res.set('X-Ignored-Ids', ignored.join(','));

      let message = 'Category(s) associated with supplier successfully';
      if (ignored.length) message += `. Ignored (inactive): ${ignored.join(',')}`;
      return res.status(201).success(null, message);
    } catch (error) {
      console.error('[SUPPLIERS] addCategories error:', error);
      if (error.message === 'Supplier not found') return res.notFound('Supplier');
      if (error.message?.includes('does not exist') || error.message?.includes('inactive')) return res.validationErrors([error.message]);
      if (error.code === 'P2002') return res.validationErrors(['One or more categories are already associated with the supplier']);
      return res.error('Error associating categories with supplier');
    }
  },

  // Remove categories from a supplier
  removeCategories: async (req, res) => {
    const { id } = req.params;
    const { idCategories } = req.body;

    const validId = parseIdParam(id); // Validate supplier ID
    if (!validId) return res.validationErrors(['idSupplier must be a positive integer']);

    if (!idCategories || !Array.isArray(idCategories) || idCategories.length === 0) {
      return res.validationErrors(['A valid array of idCategories must be provided']);
    }

    const validCatIds = idCategories.map(catId => {
      const validCatId = parseIdParam(catId);
      if (!validCatId) throw new Error(`idCategory ${catId} must be a positive integer`);
      return validCatId;
    });

    try {
      // Remove categories using the service
      await SupplierService.removeCategories(validId, validCatIds);
      return res.success(null, 'Category(s) removed from supplier successfully');
    } catch (error) {
      console.error('[SUPPLIERS] removeCategories error:', error);
      if (error.code === 'P2025') return res.notFound('Supplier-category relationship');
      return res.error('Error removing categories from supplier');
    }
  },

  // ===== PHONES RELATIONSHIPS =====

  // Fetch all phones associated with a supplier
  getPhones: async (req, res) => {
    const { id } = req.params;
    const validId = parseIdParam(id);
    if (!validId) return res.validationErrors(['idSupplier must be a positive integer']);

    try {
      const supplier = await SupplierService.findById(validId);
      if (!supplier) return res.notFound('Supplier');

      const phones = await SupplierService.getPhones(validId);
      return res.success(phones);
    } catch (error) {
      console.error('[SUPPLIERS] getPhones error:', error);
      return res.error('Error fetching supplier phones');
    }
  },

  // Add one or multiple phones to a supplier
  addPhones: async (req, res) => {
    const { id } = req.params;
    const { idPhones } = req.body;

    const validId = parseIdParam(id);
    if (!validId) return res.validationErrors(['idSupplier must be a positive integer']);
    if (!idPhones || !Array.isArray(idPhones) || idPhones.length === 0) {
      return res.validationErrors(['A valid array of idPhones must be provided']);
    }

    const validPhoneIds = idPhones.map(phoneId => {
      const validPhoneId = parseIdParam(phoneId);
      if (!validPhoneId) throw new Error(`idPhone ${phoneId} must be a positive integer`);
      return validPhoneId;
    });

    try {
      const result = await SupplierService.addPhones(validId, validPhoneIds);

      const ignored = (result && Array.isArray(result.ignoredInactiveIds)) ? result.ignoredInactiveIds : [];
      if (ignored.length) res.set('X-Ignored-Ids', ignored.join(','));

      let message = 'Phone(s) associated with supplier successfully';
      if (ignored.length) message += `. Ignored (inactive): ${ignored.join(',')}`;
      return res.status(201).success(null, message);
    } catch (error) {
      console.error('[SUPPLIERS] addPhones error:', error);
      if (error.message === 'Supplier not found') return res.notFound('Supplier');
      if (error.message?.includes('does not exist') || error.message?.includes('inactive')) return res.validationErrors([error.message]);
      if (error.code === 'P2002') return res.validationErrors(['One or more phones are already associated with the supplier']);
      return res.error('Error associating phones with supplier');
    }
  },

  // Remove one or multiple phones from a supplier
  removePhones: async (req, res) => {
    const { id } = req.params;
    const { idPhones } = req.body;

    const validId = parseIdParam(id);
    if (!validId) return res.validationErrors(['idSupplier must be a positive integer']);
    if (!idPhones || !Array.isArray(idPhones) || idPhones.length === 0) {
      return res.validationErrors(['A valid array of idPhones must be provided']);
    }

    const validPhoneIds = idPhones.map(phoneId => {
      const validPhoneId = parseIdParam(phoneId);
      if (!validPhoneId) throw new Error(`idPhone ${phoneId} must be a positive integer`);
      return validPhoneId;
    });

    try {
      // Remove phones using the service
      await SupplierService.removePhones(validId, validPhoneIds);
      return res.success(null, 'Phone(s) removed from supplier successfully');
    } catch (error) {
      console.error('[SUPPLIERS] removePhones error:', error);
      if (error.code === 'P2025') return res.notFound('Supplier-phone relationship');
      return res.error('Error removing phones from supplier');
    }
  },

    

    
  };//End of SupplierController

// Export the SupplierController
module.exports = { SupplierController };
