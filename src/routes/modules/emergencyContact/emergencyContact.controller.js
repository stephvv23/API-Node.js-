

const { EmergencyContactsService } = require('./emergencyContact.service');
const { EntityValidators } = require('../../../utils/validator');

// List of valid relationships for emergency contacts
const VALID_RELATIONSHIPS = [
  'Cónyuge / pareja',
  'Hijo / hija',
  'Padre / madre',
  'Hermano / hermana',
  'Nieto / nieta',
  'Tío / tía',
  'Primo / prima',
  'Amigo cercano',
  'Conocido',
  'Cuidadores profesionales',
  'Voluntario / apoyo comunitario',
  'Tutor legal / representante',
  'Otro'
];

/**
 * EmergencyContactController handles HTTP requests for emergency contacts.
 * All responses use standardized helpers (res.success, res.error, etc.)
 * Validation is performed using EntityValidators.emergencyContact.
 */
const EmergencyContactController = {
  /**
   * List all emergency contacts
   * GET /emergency-contacts
   */
  list: async (_req, res) => {
    try {
      const emergencyContacts = await EmergencyContactsService.list();
      // Return all emergency contacts with a success response
      return res.success(emergencyContacts);
    } catch (error) {
      // Log and return a standardized error response
      console.error('[EMERGENCY CONTACT] list error:', error);
      return res.error('Error retrieving emergency contacts');
    }
  },

  /**
   * Get a single emergency contact by ID
   * GET /emergency-contacts/:idEmergencyContact
   */
  get: async (req, res) => {
    const { idEmergencyContact } = req.params;
    const id = Number(idEmergencyContact);
    // Validate that the ID is a positive integer
    if (!Number.isInteger(id) || id <= 0) {
      return res.validationErrors(['idEmergencyContact must be a positive integer']);
    }
    try {
      const contact = await EmergencyContactsService.get(id);
      if (!contact) {
        // Return 404 if not found
        return res.notFound('Emergency contact');
      }
      // Return the found contact
      return res.success(contact);
    } catch (error) {
      // Log and return a standardized error response
      console.error('[EMERGENCY CONTACT] get error:', error);
      return res.error('Error retrieving emergency contact');
    }
  },

  /**
   * Create a new emergency contact
   * POST /emergency-contacts
   */
  create: async (req, res) => {
    // Check for JSON parsing errors
    if (req.body.__jsonError) {
      return res.validationErrors([req.body.__jsonErrorMessage || 'Formato de JSON inválido']);
    }

    const { nameEmergencyContact, emailEmergencyContact, relationship, status } = req.body;
    // Validate input using centralized validator (all fields required)
    const validation = EntityValidators.emergencyContact({ nameEmergencyContact, emailEmergencyContact, relationship, status }, { partial: false });
    const errors = [...validation.errors];
    // Check if relationship is in the allowed list
    if (relationship && !VALID_RELATIONSHIPS.includes(relationship)) {
      errors.push(`relationship must be one of: ${VALID_RELATIONSHIPS.join(', ')}`);
    }
    if (errors.length > 0) {
      // Return validation errors if any
      return res.validationErrors(errors);
    }
    try {
      // Create the new emergency contact
      const newContact = await EmergencyContactsService.create({ nameEmergencyContact, emailEmergencyContact, relationship, status });
      // Return the created contact with a 201 status
      return res.status(201).success(newContact, 'Emergency contact created successfully');
    } catch (error) {
      // Log and return a standardized error response
      console.error('[EMERGENCY CONTACT] create error:', error);
      return res.error('Error creating emergency contact');
    }
  },

  /**
   * Update an existing emergency contact by ID
   * PUT /emergency-contacts/:idEmergencyContact
   */
  update: async (req, res) => {
    const { idEmergencyContact } = req.params;
    const id = Number(idEmergencyContact);
    
    // Check for JSON parsing errors
    if (req.body.__jsonError) {
      return res.validationErrors([req.body.__jsonErrorMessage || 'Formato de JSON inválido']);
    }

    // Validate that the ID is a positive integer
    if (!Number.isInteger(id) || id <= 0) {
      return res.validationErrors(['idEmergencyContact must be a positive integer']);
    }
    // Validate input using centralized validator (partial mode for updates)
    const validation = EntityValidators.emergencyContact(req.body, { partial: true });
    const errors = [...validation.errors];
    // If relationship is present, check if it is in the allowed list
    if (req.body.relationship !== undefined && req.body.relationship && !VALID_RELATIONSHIPS.includes(req.body.relationship)) {
      errors.push(`relationship must be one of: ${VALID_RELATIONSHIPS.join(', ')}`);
    }
    if (errors.length > 0) {
      // Return validation errors if any
      return res.validationErrors(errors);
    }
    try {
      // Check if the contact exists before updating
      const exists = await EmergencyContactsService.get(id);
      if (!exists) {
        // Return 404 if not found
        return res.notFound('Emergency contact');
      }
      // Update the emergency contact
      const updated = await EmergencyContactsService.update(id, req.body);
      // Return the updated contact
      return res.success(updated, 'Emergency contact updated successfully');
    } catch (error) {
      if (error.code === 'P2025') {
        // Handle Prisma not found error
        return res.notFound('Emergency contact');
      }
      // Log and return a standardized error response
      console.error('[EMERGENCY CONTACT] update error:', error);
      return res.error('Error updating emergency contact');
    }
  },

  /**
   * Soft delete an emergency contact by ID
   * DELETE /emergency-contacts/:idEmergencyContact
   */
  delete: async (req, res) => {
    const { idEmergencyContact } = req.params;
    const id = Number(idEmergencyContact);
    // Validate that the ID is a positive integer
    if (!Number.isInteger(id) || id <= 0) {
      return res.validationErrors(['idEmergencyContact must be a positive integer']);
    }
    try {
      // Check if the contact exists before deleting
      const exists = await EmergencyContactsService.get(id);
      if (!exists) {
        // Return 404 if not found
        return res.notFound('Emergency contact');
      }
      // Perform soft delete
      const deleted = await EmergencyContactsService.softDelete(id);
      // Return the deleted contact
      return res.success(deleted, 'Emergency contact deleted successfully');
    } catch (error) {
      if (error.code === 'P2025') {
        // Handle Prisma not found error
        return res.notFound('Emergency contact');
      }
      // Log and return a standardized error response
      console.error('[EMERGENCY CONTACT] delete error:', error);
      return res.error('Error deleting emergency contact');
    }
  },
};

// Export the controller for use in routes
module.exports = { EmergencyContactController };
