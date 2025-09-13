// controllers/emergencyContactController.js
const { EmergencyContactsService } = require('./emergencyContact.service');

/**
 * EmergencyContactController handles HTTP requests for emergency contacts.
 */
const EmergencyContactController = {
  /**
   * List all emergency contacts.
   * GET /emergency-contacts
   */
  list: async (_req, res, next) => {
    try {
      const emergencyContacts = await EmergencyContactsService.list();
      res.json(emergencyContacts);
    } catch (err) {
      console.error("Error in list method:", err);
      next(err);
    }
   
  },


  /**
   * Get an emergency contact by id.
   * GET /emergency-contacts/:idEmergencyContact
   */
  get: async (req, res, next) => {
    try {
      const emergencyContact = await EmergencyContactsService.get(req.params.idEmergencyContact);
      if (!emergencyContact) {
        return res.status(404).json({ message: 'Contacto de emergencia no encontrado' });
      }
      res.json(emergencyContact);
    } catch (err) { next(err); }
  },


  /**
   * Create a new emergency contact.
   * POST /emergency-contacts
   */
  create: async (req, res, next) => {
    try {
      const emergencyContact = await EmergencyContactsService.create(req.body);
      res.status(201).json(emergencyContact);
    } catch (err) { next(err); }
  },


  /**
   * Update an emergency contact by id.
   * PUT /emergency-contacts/:idEmergencyContact
   */
  update: async (req, res, next) => {
    try {
      const emergencyContact = await EmergencyContactsService.update(req.params.idEmergencyContact, req.body);
      if (!emergencyContact) {
        return res.status(404).json({ message: 'Contacto de emergencia no encontrado' });
      }
      res.json(emergencyContact);
    } catch (err) { next(err); }
  },


  /**
   * Delete an emergency contact by id.
   * DELETE /emergency-contacts/:idEmergencyContact
   */
  delete: async (req, res, next) => {
    try {
      await EmergencyContactsService.delete(req.params.idEmergencyContact);
      res.status(204).end();
    } catch (err) { next(err); }
  },
};


module.exports = { EmergencyContactController };
