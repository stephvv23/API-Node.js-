
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

    // ===== HEADQUARTERS RELATIONSHIPS =====
  getHeadquarters: async (idSupplier) => {
    // Retrieve all supplier-headquarter relationships from the repository
    const result = await SupplierRepository.getHeadquarters(idSupplier);

    // Map the result to return only the headquarter objects, not the join table records
    return result.map(item => item.headquarter);
  },

  addHeadquarters: async (idSupplier, idHeadquarters) => {
    // Ensure the supplier exists before attempting to add headquarters
    const supplier = await SupplierRepository.findById(idSupplier);
    if (!supplier) throw new Error('Supplier not found');

    // Normalize input to an array for uniform processing
    const headquarterIds = Array.isArray(idHeadquarters) ? idHeadquarters : [idHeadquarters];

    // Prepare arrays to track missing, inactive, and valid headquarter IDs
    const missing = [];
    const inactive = [];
    const activeIds = [];

    // Validate each headquarter ID
    for (const idHq of headquarterIds) {
      // Check if the headquarter exists and is active
      const headquarterStatus = await SupplierRepository.headquarterExists(idHq);
      if (!headquarterStatus.exists) missing.push(idHq);  // Headquarter does not exist
      else if (!headquarterStatus.active) inactive.push(idHq);  // Headquarter exists but is inactive
      else activeIds.push(idHq);  // Headquarter exists and is active
    }

    // Throw errors if there are missing or all inactive headquarters
    if (missing.length > 0) throw new Error(`Headquarter(s) with ID(s) ${missing.join(', ')} do not exist`);
    if (activeIds.length === 0) throw new Error('All provided headquarters are inactive');

    // Add the valid, active headquarters to the supplier
    let result;
    if (activeIds.length === 1) {
      // Single headquarter: use the single add method
      result = await SupplierRepository.addHeadquarter(idSupplier, activeIds[0]);
    } else {
      // Multiple headquarters: use the batch add method
      result = await SupplierRepository.addHeadquarters(idSupplier, activeIds);
    }

    // Return information about added and ignored headquarters
    return {
      addedCount: Array.isArray(result) ? result.length : (result ? 1 : 0), // Number of successfully added
      addedIds: activeIds,      // IDs that were successfully added
      ignoredInactiveIds: inactive, // IDs ignored due to inactive status
    };
  },

  removeHeadquarters: async (idSupplier, idHeadquarters) => {
    // Normalize input to array to handle single or multiple IDs
    const headquarterIds = Array.isArray(idHeadquarters) ? idHeadquarters : [idHeadquarters];

    // Use single remove method if only one ID, otherwise batch remove
    if (headquarterIds.length === 1) {
      return SupplierRepository.removeHeadquarter(idSupplier, headquarterIds[0]);
    }
    return SupplierRepository.removeHeadquarters(idSupplier, headquarterIds);
  },

  // ===== CATEGORIES RELATIONSHIPS =====
  getCategories: async (idSupplier) => {
    // Retrieve all supplier-category relationships
    const result = await SupplierRepository.getCategories(idSupplier);

    // Map to return only the category objects, not the join table entries
    return result.map(item => item.category);
  },

  addCategories: async (idSupplier, idCategories) => {
    // Ensure supplier exists
    const supplier = await SupplierRepository.findById(idSupplier);
    if (!supplier) throw new Error('Supplier not found');

    // Normalize input to array
    const categoryIds = Array.isArray(idCategories) ? idCategories : [idCategories];

    // Arrays to track missing, inactive, and valid categories
    const missing = [];
    const inactive = [];
    const activeIds = [];

    // Validate each category ID
    for (const idCat of categoryIds) {
      const categoryStatus = await SupplierRepository.categoryExists(idCat);
      if (!categoryStatus.exists) missing.push(idCat);      // Category does not exist
      else if (!categoryStatus.active) inactive.push(idCat); // Category exists but inactive
      else activeIds.push(idCat);                           // Category exists and active
    }

    // Throw errors if missing categories or none active
    if (missing.length > 0) throw new Error(`Category(s) with ID(s) ${missing.join(', ')} do not exist`);
    if (activeIds.length === 0) throw new Error('All provided categories are inactive');

    // Add valid categories
    let result;
    if (activeIds.length === 1) result = await SupplierRepository.addCategory(idSupplier, activeIds[0]);
    else result = await SupplierRepository.addCategories(idSupplier, activeIds);

    // Return info about added and ignored categories
    return {
      addedCount: Array.isArray(result) ? result.length : (result ? 1 : 0),
      addedIds: activeIds,
      ignoredInactiveIds: inactive,
    };
  },

  removeCategories: async (idSupplier, idCategories) => {
    // Normalize input to array
    const categoryIds = Array.isArray(idCategories) ? idCategories : [idCategories];

    // Use single or batch remove
    if (categoryIds.length === 1) return SupplierRepository.removeCategory(idSupplier, categoryIds[0]);
    return SupplierRepository.removeCategories(idSupplier, categoryIds);
  },

  // ===== PHONES RELATIONSHIPS =====
  getPhones: async (idSupplier) => {
    // Retrieve all supplier-phone relationships
    const result = await SupplierRepository.getPhones(idSupplier);

    // Map to return only phone objects
    return result.map(item => item.phone);
  },

  addPhones: async (idSupplier, idPhones) => {
    // Ensure supplier exists
    const supplier = await SupplierRepository.findById(idSupplier);
    if (!supplier) throw new Error('Supplier not found');

    // Normalize input to array
    const phoneIds = Array.isArray(idPhones) ? idPhones : [idPhones];

    // Arrays to track missing, inactive, and valid phones
    const missing = [];
    const inactive = [];
    const activeIds = [];

    // Validate each phone ID
    for (const idPhone of phoneIds) {
      const phoneStatus = await SupplierRepository.phoneExists(idPhone);
      if (!phoneStatus.exists) missing.push(idPhone);      // Phone does not exist
      else if (!phoneStatus.active) inactive.push(idPhone); // Phone exists but inactive
      else activeIds.push(idPhone);                        // Phone exists and active
    }

    // Throw errors if missing phones or none active
    if (missing.length > 0) throw new Error(`Phone(s) with ID(s) ${missing.join(', ')} do not exist`);
    if (activeIds.length === 0) throw new Error('All provided phones are inactive');

    // Add valid phones
    let result;
    if (activeIds.length === 1) result = await SupplierRepository.addPhone(idSupplier, activeIds[0]);
    else result = await SupplierRepository.addPhones(idSupplier, activeIds);

    // Return info about added and ignored phones
    return {
      addedCount: Array.isArray(result) ? result.length : (result ? 1 : 0),
      addedIds: activeIds,
      ignoredInactiveIds: inactive,
    };
  },

  removePhones: async (idSupplier, idPhones) => {
    // Normalize input to array
    const phoneIds = Array.isArray(idPhones) ? idPhones : [idPhones];

    // Use single remove if one ID, otherwise batch remove
    if (phoneIds.length === 1) return SupplierRepository.removePhone(idSupplier, phoneIds[0]);
    return SupplierRepository.removePhones(idSupplier, phoneIds);
  },

};

module.exports = { SupplierService }; // Export the SupplierService
