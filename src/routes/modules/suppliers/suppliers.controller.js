

const { SupplierService } = require('./suppliers.service'); // Import the SupplierService
const { SecurityLogService } = require('../../../services/securitylog.service'); // Import SecurityLogService
const { EntityValidators, ValidationRules } = require('../../../utils/validator'); // Import EntityValidators and ValidationRules
let prisma = require('../../../lib/prisma.js'); // Import Prisma client

// Helper function to parse and validate ID parameter
function parseIdParam(id) {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Helper function to format logs
const formatField = (field) => field || 'N/A';

// Helper function to transform supplier data from DB format to API format
function transformSupplierData(supplier) {
  if (!supplier) return null;
  
  return {
    ...supplier,
    // Transform categorySupplier to categories array
    categories: supplier.categorySupplier?.map(cs => cs.category) || [],
    // Transform headquarterSupplier to headquarters array
    headquarters: supplier.headquarterSupplier?.map(hs => hs.headquarter) || [],
    // Transform phoneSupplier to phones array (convert phone integers to strings)
    phones: supplier.phoneSupplier?.map(ps => String(ps.phone?.phone || '')) || [],
    // Remove junction table data
    categorySupplier: undefined,
    headquarterSupplier: undefined,
    phoneSupplier: undefined
  };
}

// SupplierController handles HTTP requests related to suppliers
const SupplierController = {

  // List all active suppliers
  getAllActive: async (_req, res) => {
    try {
      const suppliers = await SupplierService.listActive();
      const transformed = suppliers.map(transformSupplierData);
      return res.success(transformed);
    } catch (error) {
  return res.error('Error al obtener los proveedores activos');
    }
  },

  // List all suppliers with optional status filter
  getAll: async (req, res, next) => {
    try {
      const { status = 'active' } = req.query;
      const allowed = ['active', 'inactive', 'all'];
      if (!allowed.includes(status)) {
    return res.validationErrors(['El estado debe ser "activo", "inactivo" o "todos"']);
      }

      const suppliers = await SupplierService.list({ status });
      const transformed = suppliers.map(transformSupplierData);
      return res.success(transformed);
    } catch (error) {
  return res.error('Error al obtener los proveedores');
    }
  },

  // Get supplier by ID
  getById: async (req, res) => {

    const { id } = req.params; // Extract supplier ID from request parameters

    // Validate that ID is a number
    const validId = parseIdParam(id);
    if (!validId) {
  return res.validationErrors(['El ID del proveedor debe ser un número válido']);
    }

    try {
      // Fetch supplier by ID
      const supplier = await SupplierService.findById(validId);
      // If supplier not found, return 404
  if (!supplier) return res.notFound('Proveedor');
      // Transform and return supplier data
      const transformed = transformSupplierData(supplier);
      return res.success(transformed);
    } catch (error) {
  return res.error('Error al obtener el proveedor');
    }
  },

  // Create new supplier
  create: async (req, res) => {

    // Trim all string fields to prevent leading/trailing spaces
    const trimmedBody = ValidationRules.trimStringFields(req.body);
    let { name, taxId, type, email, address, paymentTerms, description, status, categories, headquarters, phones } = trimmedBody;

    // Validate phone numbers (if provided)
    if (Array.isArray(phones) && phones.length > 0) {
      for (const phone of phones) {
        if (!/^[0-9]+$/.test(phone)) {
          return res.validationErrors(['El número de teléfono solo puede contener dígitos.']);
        }
        if (phone.length > 12) {
          return res.validationErrors(['El número de teléfono no puede contener más de 12 dígitos.']);
        }
      }
    }

    // Handle undefined taxId
    if (taxId === undefined || taxId === null || taxId === '') {
      taxId = "Indefinido";
    }

    // Validation
    const validation = EntityValidators.supplier(
      { name, taxId, type, email, address, paymentTerms, description, status },
      { partial: false }
    );
    if (!validation.isValid) return res.validationErrors(validation.errors);

    try {
      // Check duplicates against ALL suppliers (active and inactive), normalized
      const allSuppliers = await SupplierService.list({ status: 'all' });
      const duplicateErrors = [];
      const norm = v => (typeof v === 'string' ? v.trim().toLowerCase() : '');

      // Check for name duplicate (normalized)
      if (name && allSuppliers.some(s => norm(s.name) === norm(name))) {
        duplicateErrors.push('Ya existe un proveedor con este nombre');
      }
      // Check for email duplicate (normalized)
      if (email && allSuppliers.some(s => norm(s.email) === norm(email))) {
        duplicateErrors.push('Ya existe un proveedor con este correo');
      }
      // Check for taxId duplicate (normalized, ignore 'Indefinido')
      if (taxId && norm(taxId) !== 'indefinido') {
        if (allSuppliers.some(s => norm(s.taxId) === norm(taxId))) {
          duplicateErrors.push('Ya existe un proveedor con este número de identificación fiscal');
        }
      }
      if (duplicateErrors.length > 0) return res.validationErrors(duplicateErrors);

      // Create supplier when no duplicates
      const newSupplier = await SupplierService.create({ name, taxId, type, email, address, paymentTerms, description, status });

      // Add relationships if provided
      const supplierId = newSupplier.idSupplier;

      // Add headquarters
      if (Array.isArray(headquarters) && headquarters.length > 0) {
        await SupplierService.addHeadquarters(supplierId, headquarters);
      }

      // Add categories
      if (Array.isArray(categories) && categories.length > 0) {
        await SupplierService.addCategories(supplierId, categories);
      }

      // Add phones (handles phone strings, not IDs)
      if (Array.isArray(phones) && phones.length > 0) {
        await SupplierService.addPhoneStrings(supplierId, phones);
      }

      // Fetch the complete supplier with all relationships
      const completeSupplier = await SupplierService.findById(supplierId);

      // Log creation action
      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'CREATE',
        description: `Se creó el proveedor: ID: "${completeSupplier.idSupplier}", Nombre: "${completeSupplier.name}", Número de identificación fiscal: "${completeSupplier.taxId}", Tipo: "${completeSupplier.type}", Email: "${completeSupplier.email}", Dirección: "${completeSupplier.address}", Términos de pago: "${completeSupplier.paymentTerms}", Descripción: "${completeSupplier.description}", Estado: "${completeSupplier.status}".`,
        affectedTable: 'Supplier',
      });

      // Transform and return success response
      const transformed = transformSupplierData(completeSupplier);
  return res.status(201).success(transformed, 'Proveedor creado exitosamente'); 

      //If error occurs while creating supplier
    } catch (error) {
  return res.error('Error al crear el proveedor');
    }
  },

  // Update supplier information
  update: async (req, res) => {

    // Trim all string fields to prevent leading/trailing spaces
    const updateData = ValidationRules.trimStringFields(req.body);

    // Validate phone numbers (if provided)
    if (Array.isArray(updateData.phones) && updateData.phones.length > 0) {
      for (const phone of updateData.phones) {
        if (!/^[0-9]+$/.test(phone)) {
          return res.validationErrors(['El número de teléfono solo puede contener dígitos.']);
        }
        if (phone.length > 12) {
          return res.validationErrors(['El número de teléfono no puede contener más de 12 dígitos.']);
        }
      }
    }

    const { id } = req.params;  // Extract supplier ID from URL parameters

    // Validate ID format
    const validId = parseIdParam(id);
    if (!validId) {
      return res.validationErrors(['El ID del proveedor debe ser un número entero positivo']);
    }

    // Prevent user from trying to modify the ID
    if (updateData.idSupplier !== undefined) {
      return res.validationErrors(['No se puede modificar el ID del proveedor']);
    }

    // ===== TAX ID HANDLING =====
    // If taxId is empty or null, assign the default value "Indefinido"
    if (updateData.taxId === undefined || updateData.taxId === null || updateData.taxId === '') {
      updateData.taxId = 'Indefinido';
    }

    // ===== VALIDATION =====
    // Perform partial validation using EntityValidators
    const validation = EntityValidators.supplier(updateData, { partial: true });
  if (!validation.isValid) return res.validationErrors(validation.errors);

    try {
      // ===== DUPLICATE CHECKS (ALL SUPPLIERS, NORMALIZED, EXCLUDE SELF, IGNORE IF SAME AS CURRENT) =====
      const allSuppliers = await SupplierService.list({ status: 'all' });
      const duplicateErrors = [];

      // Normalize helper
      const norm = v => (typeof v === 'string' ? v.trim().toLowerCase() : '');
      const selfId = validId;
      const currentSupplier = allSuppliers.find(s => s.idSupplier === selfId);


      // Check for name duplicate (excluding self, normalized, ignore if same as current)
      if (updateData.name) {
        const normName = norm(updateData.name);
        const currentNormName = currentSupplier ? norm(currentSupplier.name) : null;
        if (normName !== currentNormName) {
          if (allSuppliers.some(s => norm(s.name) === normName && s.idSupplier !== selfId)) {
            duplicateErrors.push('Ya existe un proveedor con este nombre');
          }
        }
      }

      // Check for email duplicate (excluding self, normalized, ignore if same as current)
      if (updateData.email) {
        const normEmail = norm(updateData.email);
        const currentNormEmail = currentSupplier ? norm(currentSupplier.email) : null;
        if (normEmail !== currentNormEmail) {
          if (allSuppliers.some(s => norm(s.email) === normEmail && s.idSupplier !== selfId)) {
            duplicateErrors.push('Ya existe un proveedor con este correo');
          }
        }
      }

      // Check for taxId duplicate (excluding self, normalized, and ignoring 'Indefinido', ignore if same as current)
      if (updateData.taxId && norm(updateData.taxId) !== 'indefinido') {
        const normTaxId = norm(updateData.taxId);
        const currentNormTaxId = currentSupplier ? norm(currentSupplier.taxId) : null;
        if (normTaxId !== currentNormTaxId) {
          if (allSuppliers.some(s => norm(s.taxId) === normTaxId && s.idSupplier !== selfId)) {
            duplicateErrors.push('Ya existe un proveedor con este número de identificación fiscal');
          }
        }
      }

      // If any duplicates found, return validation errors
      if (duplicateErrors.length > 0) return res.validationErrors(duplicateErrors);

      // ===== FETCH EXISTING SUPPLIER =====
      const previousSupplier = await SupplierService.findById(validId);
  if (!previousSupplier) return res.notFound('Proveedor');

      // ===== UPDATE SUPPLIER (main fields) =====
      const updatedSupplier = await SupplierService.update(validId, updateData);
      const userEmail = req.user?.sub; // Get current user email for logging

      // ===== PHONES UPDATE LOGIC =====
      if (Array.isArray(updateData.phones)) {
        // Remove all old phone relationships
        await SupplierService.removeAllPhones(validId);
        // Add new phones (if any)
        if (updateData.phones.length > 0) {
          await SupplierService.addPhoneStrings(validId, updateData.phones);
        }
      }

      // ===== LOGGING =====
      // Detect if only status changed from inactive to active
      const onlyStatusChange =
        previousSupplier.status === 'inactive' &&
        updatedSupplier.status === 'active' &&
        previousSupplier.name === updatedSupplier.name &&
        previousSupplier.email === updatedSupplier.email &&
        previousSupplier.taxId === updatedSupplier.taxId &&
        previousSupplier.type === updatedSupplier.type &&
        previousSupplier.address === updatedSupplier.address &&
        previousSupplier.paymentTerms === updatedSupplier.paymentTerms &&
        previousSupplier.description === updatedSupplier.description;

      // If only status changed, log as REACTIVATE
      if (onlyStatusChange) {
        await SecurityLogService.log({
          email: userEmail,
          action: 'REACTIVATE',
          description: `Se reactivó el proveedor: ID "${updatedSupplier.idSupplier}", Nombre: "${updatedSupplier.name}", Número de identificación fiscal: "${updatedSupplier.taxId}", Tipo: "${updatedSupplier.type}", Email: "${updatedSupplier.email}", Dirección: "${updatedSupplier.address}", Términos de pago: "${updatedSupplier.paymentTerms}", Descripción: "${updatedSupplier.description}", Estado: "${updatedSupplier.status}".`,
          affectedTable: 'Supplier',
        });
      } else {
        // Otherwise, log as UPDATE with detailed before/after values
        await SecurityLogService.log({
          email: userEmail,
          action: 'UPDATE',
          description:
            `Se actualizó el proveedor: ID "${validId}".\n` +
            `Versión anterior: Nombre: "${previousSupplier.name}", Número de identificación fiscal: "${previousSupplier.taxId}", Tipo: "${previousSupplier.type}", Email: "${previousSupplier.email}", Dirección: "${previousSupplier.address}", Términos de pago: "${previousSupplier.paymentTerms}", Descripción: "${previousSupplier.description}", Estado: "${previousSupplier.status}".\n` +
            `Nueva versión: Nombre: "${updatedSupplier.name}", Número de identificación fiscal: "${updatedSupplier.taxId}", Tipo: "${updatedSupplier.type}", Email: "${updatedSupplier.email}", Dirección: "${updatedSupplier.address}", Términos de pago: "${updatedSupplier.paymentTerms}", Descripción: "${updatedSupplier.description}", Estado: "${updatedSupplier.status}".`,
          affectedTable: 'Supplier',
        });
      }

      // Fetch the updated supplier with all relationships
      const supplierWithRelations = await SupplierService.findById(validId);
      // Transform and return success response
      const transformed = transformSupplierData(supplierWithRelations);
  return res.success(transformed, 'Proveedor actualizado exitosamente');
    } catch (error) {
  return res.error('Error al actualizar el proveedor');
    }
  },

  // Delete (inactivate) supplier
  delete: async (req, res) => {

    // Extract supplier ID from request parameters
    const { id } = req.params;

    // Validate that ID is a number
    const validId = parseIdParam(id);
    if (!validId) {
      return res.validationErrors(['El ID del proveedor debe ser un número válido']);
    }

    // Check if supplier exists by id before attempting deletion
    const exists = await SupplierService.findById(validId);
  if (!exists) return res.notFound('Proveedor');

    //If supplier exists, proceed to inactivate
    try {
      const deletedSupplier = await SupplierService.remove(validId); // Soft delete (inactivate) supplier
      const userEmail = req.user?.sub; // Get user email for logging

      // Log inactivation action
      await SecurityLogService.log({
        email: userEmail,
        action: 'INACTIVE',
        description: `Se inactivó el proveedor: ID "${validId}", Nombre: "${deletedSupplier.name}", Número de identificación fiscal: "${deletedSupplier.taxId}", Tipo: "${deletedSupplier.type}", Email: "${deletedSupplier.email}", Dirección: "${deletedSupplier.address}", Términos de pago: "${deletedSupplier.paymentTerms}", Descripción: "${deletedSupplier.description}", Estado: "${deletedSupplier.status}".`,
        affectedTable: 'Supplier',
      });

      // Transform and return success response
      const transformed = transformSupplierData(deletedSupplier);
  return res.success(transformed, 'Proveedor inactivado exitosamente'); 

      //If does not exist or error occurs while deleting supplier
    } catch (error) {
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
  return res.error('Error al obtener los datos de referencia para proveedores');
    }
  },

  // ===== HEADQUARTERS RELATIONSHIPS =====

  // Fetch all headquarters associated with a specific supplier
  getHeadquarters: async (req, res) => {
    const { id } = req.params; // Extract supplier ID from the request URL
    const validId = parseIdParam(id); // Validate that the supplier ID is a positive integer
  if (!validId) return res.validationErrors(['El ID del proveedor debe ser un número entero positivo']); // Return validation error if invalid

    try {
      const supplier = await SupplierService.findById(validId); // Check if the supplier exists in the database
  if (!supplier) return res.notFound('Proveedor'); // Return 404 if supplier does not exist
      // Fetch all headquarters linked to the supplier using the service layer
      const headquarters = await SupplierService.getHeadquarters(validId);
      // Return the list of headquarters as a success response
      return res.success(headquarters);
    } catch (error) {
  return res.error('Error al obtener las sedes del proveedor');
    }
  },

  // Associate one or multiple headquarters with a supplier
  addHeadquarters: async (req, res) => {
    const { id } = req.params; // Extract supplier ID
    const { idHeadquarters } = req.body; // Extract the array of headquarters IDs to associate

    const validId = parseIdParam(id); // Validate supplier ID
  if (!validId) return res.validationErrors(['El ID del proveedor debe ser un número entero positivo']);

    // Validate that input is a non-empty array of IDs
    if (!idHeadquarters || !Array.isArray(idHeadquarters) || idHeadquarters.length === 0) {
      return res.validationErrors(['Debe proporcionarse una matriz válida de id de sedes']);
    }

    // Convert and validate each headquarter ID to ensure positive integers
    const validHqIds = idHeadquarters.map(hqId => {
      const validHqId = parseIdParam(hqId);
      if (!validHqId) throw new Error(`idHeadquarter ${hqId} debe ser un número entero positivo`);
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
  let message = 'Sede(s) asociada(s) correctamente al proveedor';
  if (ignored.length) message += `. Ignoradas (inactivas): ${ignored.join(',')}`;
  return res.status(201).success(null, message); // Send a success response with status 201
    } catch (error) {
      // Handle specific error cases with clear messages
  if (error.message === 'Supplier not found') return res.notFound('Proveedor');
  if (error.message?.includes('does not exist') || error.message?.includes('inactive')) return res.validationErrors([error.message]);
  if (error.code === 'P2002') return res.validationErrors(['Una o más sedes ya están asociadas al proveedor']);
  return res.error('Error al asociar sedes al proveedor');
    }
  },

  // Remove one or multiple headquarters from a supplier
  removeHeadquarters: async (req, res) => {
    const { id } = req.params;
    const { idHeadquarters } = req.body;

    const validId = parseIdParam(id); // Validate supplier ID
  if (!validId) return res.validationErrors(['El ID del proveedor debe ser un número entero positivo']);

    // Validate input array
    if (!idHeadquarters || !Array.isArray(idHeadquarters) || idHeadquarters.length === 0) {
      return res.validationErrors(['Debe proporcionarse una matriz válida de id de sedes']);
    }

    // Validate each headquarter ID
    const validHqIds = idHeadquarters.map(hqId => {
      const validHqId = parseIdParam(hqId);
      if (!validHqId) throw new Error(`idHeadquarter ${hqId} debe ser un número entero positivo`);
      return validHqId;
    });

    try {
      // Remove the headquarters relationships using the service
      await SupplierService.removeHeadquarters(validId, validHqIds);
  return res.success(null, 'Sede(s) eliminada(s) del proveedor con éxito');
    } catch (error) {
  if (error.code === 'P2025') return res.notFound('Relación proveedor-sede no encontrada'); // Specific error if relation not found
  return res.error('Error al eliminar sedes del proveedor');
    }
  },

  // ===== CATEGORIES RELATIONSHIPS =====

  // Fetch all categories associated with a supplier
  getCategories: async (req, res) => {
    const { id } = req.params;
    const validId = parseIdParam(id); // Ensure supplier ID is valid
  if (!validId) return res.validationErrors(['El ID del proveedor debe ser un número entero positivo']);

    try {
      const supplier = await SupplierService.findById(validId);
  if (!supplier) return res.notFound('Proveedor'); // Return 404 if supplier does not exist
      // Fetch categories associated with the supplier
      const categories = await SupplierService.getCategories(validId);
      return res.success(categories);
    } catch (error) {
  return res.error('Error al obtener las categorías del proveedor');
    }
  },

  // Add one or multiple categories to a supplier
  addCategories: async (req, res) => {
    const { id } = req.params;
    const { idCategories } = req.body;

    const validId = parseIdParam(id); // Validate supplier ID
  if (!validId) return res.validationErrors(['El ID del proveedor debe ser un número entero positivo']);

    // Validate input array
    if (!idCategories || !Array.isArray(idCategories) || idCategories.length === 0) {
      return res.validationErrors(['Debe proporcionarse una matriz válida de id de categorías']);
    }

    // Validate each category ID
    const validCatIds = idCategories.map(catId => {
      const validCatId = parseIdParam(catId);
      if (!validCatId) throw new Error(`idCategory ${catId} debe ser un número entero positivo`);
      return validCatId;
    });

    try {
      // Add categories via the service
      const result = await SupplierService.addCategories(validId, validCatIds);

      // Track ignored categories (inactive ones)
      const ignored = (result && Array.isArray(result.ignoredInactiveIds)) ? result.ignoredInactiveIds : [];
      if (ignored.length) res.set('X-Ignored-Ids', ignored.join(','));

  let message = 'Categoría(s) asociada(s) correctamente al proveedor';
  if (ignored.length) message += `. Ignoradas (inactivas): ${ignored.join(',')}`;
  return res.status(201).success(null, message);
    } catch (error) {
  if (error.message === 'Supplier not found') return res.notFound('Proveedor');
  if (error.message?.includes('does not exist') || error.message?.includes('inactive')) return res.validationErrors([error.message]);
  if (error.code === 'P2002') return res.validationErrors(['Una o más categorías ya están asociadas al proveedor']);
  return res.error('Error al asociar categorías al proveedor');
    }
  },

  // Remove categories from a supplier
  removeCategories: async (req, res) => {
    const { id } = req.params;
    const { idCategories } = req.body;

    const validId = parseIdParam(id); // Validate supplier ID
  if (!validId) return res.validationErrors(['El ID del proveedor debe ser un número entero positivo']);

    if (!idCategories || !Array.isArray(idCategories) || idCategories.length === 0) {
      return res.validationErrors(['Debe proporcionarse una matriz válida de id de categorías']);
    }

    const validCatIds = idCategories.map(catId => {
      const validCatId = parseIdParam(catId);
      if (!validCatId) throw new Error(`idCategory ${catId} debe ser un número entero positivo`);
      return validCatId;
    });

    try {
      // Remove categories using the service
      await SupplierService.removeCategories(validId, validCatIds);
  return res.success(null, 'Categoría(s) eliminada(s) del proveedor exitosamente');
    } catch (error) {
  if (error.code === 'P2025') return res.notFound('Relación proveedor-categoría no encontrada');
  return res.error('Error al eliminar categorías del proveedor');
    }
  },

  // ===== PHONES RELATIONSHIPS =====

  // Fetch all phones associated with a supplier
  getPhones: async (req, res) => {
    const { id } = req.params;
    const validId = parseIdParam(id);
  if (!validId) return res.validationErrors(['El ID del proveedor debe ser un número entero positivo']);

    try {
      const supplier = await SupplierService.findById(validId);
  if (!supplier) return res.notFound('Proveedor');
      const phones = await SupplierService.getPhones(validId);
      return res.success(phones);
    } catch (error) {
  return res.error('Error al obtener los teléfonos del proveedor');
    }
  },

  // Add one or multiple phones to a supplier
  addPhones: async (req, res) => {
    const { id } = req.params;
    const { idPhones } = req.body;

    const validId = parseIdParam(id);
  if (!validId) return res.validationErrors(['El ID del proveedor debe ser un número entero positivo']);
    if (!idPhones || !Array.isArray(idPhones) || idPhones.length === 0) {
      return res.validationErrors(['Debe proporcionarse una matriz válida de id de teléfonos']);
    }

    const validPhoneIds = idPhones.map(phoneId => {
      const validPhoneId = parseIdParam(phoneId);
      if (!validPhoneId) throw new Error(`idPhone ${phoneId} debe ser un número entero positivo`);
      return validPhoneId;
    });

    try {
      const result = await SupplierService.addPhones(validId, validPhoneIds);

      const ignored = (result && Array.isArray(result.ignoredInactiveIds)) ? result.ignoredInactiveIds : [];
      if (ignored.length) res.set('X-Ignored-Ids', ignored.join(','));

  let message = 'Teléfono(s) asociado(s) correctamente al proveedor';
  if (ignored.length) message += `. Ignorados (inactivos): ${ignored.join(',')}`;
  return res.status(201).success(null, message);
    } catch (error) {
  if (error.message === 'Supplier not found') return res.notFound('Proveedor');
  if (error.message?.includes('does not exist') || error.message?.includes('inactive')) return res.validationErrors([error.message]);
  if (error.code === 'P2002') return res.validationErrors(['Uno o más teléfonos ya están asociados al proveedor']);
  return res.error('Error al asociar teléfonos al proveedor');
    }
  },

  // Remove one or multiple phones from a supplier
  removePhones: async (req, res) => {
    const { id } = req.params;
    const { idPhones } = req.body;

    const validId = parseIdParam(id);
  if (!validId) return res.validationErrors(['El ID del proveedor debe ser un número entero positivo']);
    if (!idPhones || !Array.isArray(idPhones) || idPhones.length === 0) {
      return res.validationErrors(['Debe proporcionarse una matriz válida de id de teléfonos']);
    }

    const validPhoneIds = idPhones.map(phoneId => {
      const validPhoneId = parseIdParam(phoneId);
      if (!validPhoneId) throw new Error(`idPhone ${phoneId} debe ser un número entero positivo`);
      return validPhoneId;
    });

    try {
      // Remove phones using the service
      await SupplierService.removePhones(validId, validPhoneIds);
  return res.success(null, 'Teléfono(s) eliminado(s) del proveedor correctamente');
    } catch (error) {
  if (error.code === 'P2025') return res.notFound('Relación proveedor-teléfono no encontrada');
  return res.error('Error al eliminar teléfonos del proveedor');
    }
  },

    

    
  };//End of SupplierController

// Export the SupplierController
module.exports = { SupplierController };
