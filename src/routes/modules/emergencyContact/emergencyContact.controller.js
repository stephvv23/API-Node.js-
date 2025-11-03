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

  // GET a single emergency contact by ID
  get: async (req, res) => {
    const { idEmergencyContact } = req.params;

    if (!/^\d+$/.test(idEmergencyContact?.trim())) {
      return res.status(400).json({ ok: false, message: 'idEmergencyContact must be an integer' });
    }

    try {
      const contact = await EmergencyContactsService.get(Number(idEmergencyContact));
      if (!contact) {
        return res.status(404).json({ ok: false, message: 'Emergency contact not found' });
      }
      res.json({ ok: true, data: contact });
    } catch (error) {
      console.error('[EMERGENCY CONTACT] get error:', error);
      res.status(500).json({ ok: false, message: 'Error fetching emergency contact' });
    }
  },

  // CREATE a new emergency contact
   create: async (req, res) => {
    const { nameEmergencyContact, emailEmergencyContact, identifier, status } = req.body;
    const errors = [];

    if (!nameEmergencyContact || typeof nameEmergencyContact !== 'string') {
      errors.push('nameEmergencyContact is required and must be a string');
    }

    if (!emailEmergencyContact || typeof emailEmergencyContact !== 'string') {
      errors.push('emailEmergencyContact is required and must be a string');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEmergencyContact)) {
      errors.push('emailEmergencyContact must be a valid email');
    }

    if (!identifier || typeof identifier !== 'string') {
      errors.push(`identifier must be one of the following: `);
    }

    if (!status || !['active', 'inactive'].includes(status)) {
      errors.push('status must be "active" or "inactive"');
    }

    if (errors.length > 0) {
      return res.status(400).json({ ok: false, errors });
    }

    try {
      const newContact = await EmergencyContactsService.create({ nameEmergencyContact, emailEmergencyContact, identifier, status });
      res.status(201).json({ ok: true, data: newContact });
    } catch (err) {
      console.error('[EMERGENCY CONTACTS] create error:', err);
      res.status(500).json({ ok: false, message: 'Error creating emergency contact' });
    }
  },

    // UPDATE an existing emergency contact by ID
    update: async (req, res) => {
        const idParam = req.params.idEmergencyContact;

        // Convert to number directly
        const id = Number(idParam);

        // If conversion fails or NaN, send error
        if (!Number.isInteger(id)) {
            return res.status(400).json({ ok: false, error: 'idEmergencyContact must be an integer' });
        }

        
        const { nameEmergencyContact, emailEmergencyContact, identifier, status } = req.body;
        const errors = [];

        // Validate fields
        if (nameEmergencyContact !== undefined && typeof nameEmergencyContact !== 'string') {
            errors.push('nameEmergencyContact must be a string');
        }
        if (emailEmergencyContact !== undefined) {
            if (typeof emailEmergencyContact !== 'string') errors.push('emailEmergencyContact must be a string');
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEmergencyContact))
            errors.push('emailEmergencyContact must be a valid email');
        }
        if (identifier !== undefined) {
            if (typeof identifier !== 'string') errors.push('identifier must be a string');
        }
        if (status !== undefined && !['active', 'inactive'].includes(status))
            errors.push('status must be "active" or "inactive"');

        if (errors.length > 0) return res.status(400).json({ ok: false, errors });

        try {
            const updated = await EmergencyContactsService.update(id, req.body);
            if (!updated)
            return res.status(404).json({ ok: false, message: `Emergency contact with ID ${id} not found` });

            res.json({ ok: true, data: updated });
        } catch (err) {
            if (err.code === 'P2025') {
            return res.status(404).json({ ok: false, message: `Emergency contact with ID ${id} not found` });
            }
            console.error('[EMERGENCY CONTACTS] update error:', err);
            res.status(500).json({ ok: false, message: 'Error updating emergency contact' });
        }
  },

  // DELETE /emergencyContacts/:idEmergencyContact - soft delete
  delete: async (req, res) => {
    const idParam = req.params.idEmergencyContact;

    // Validate that the ID contains only digits
    if (!/^\d+$/.test(idParam)) {
        return res.status(400).json({ ok: false, error: 'idEmergencyContact must be an integer' });
    }

    const id = Number(idParam);

    try {
        const deleted = await EmergencyContactsService.softDelete(id); // softDelete cambia status a inactive
        res.json({ ok: true, data: deleted });
    } catch (err) {
        // Handle Prisma "record not found" error
        if (err.code === 'P2025') {
        return res.status(404).json({ ok: false, message: `Emergency contact with ID ${id} not found` });
        }
        console.error('[EMERGENCY CONTACTS] soft delete error:', err);
        res.status(500).json({ ok: false, message: 'Error performing soft delete on emergency contact' });
    }
  },

};


// Export the controller for use in routes
module.exports = { EmergencyContactController };
