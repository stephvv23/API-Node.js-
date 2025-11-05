
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
      console.error("Error en el método de listado:", err);
      next(err);
    }
   
  },

  // GET a single emergency contact by ID
  get: async (req, res) => {
    const { idEmergencyContact } = req.params;

    if (!/^\d+$/.test(idEmergencyContact?.trim())) {
      return res.status(400).json({ ok: false, message: 'idEmergencyContact debe ser un número entero' });
    }

    try {
      const contact = await EmergencyContactsService.get(Number(idEmergencyContact));
      if (!contact) {
        return res.status(404).json({ ok: false, message: 'No se encontró el contacto de emergencia' });
      }
      res.json({ ok: true, data: contact });
    } catch (error) {
      console.error('[EMERGENCY CONTACT] error al obtener:', error);
      res.status(500).json({ ok: false, message: 'Error al obtener el contacto de emergencia' });
    }
  },

  // CREATE a new emergency contact
   create: async (req, res) => {
    const { nameEmergencyContact, emailEmergencyContact, identifier, status } = req.body;
    const errors = [];

    if (!nameEmergencyContact || typeof nameEmergencyContact !== 'string') {
      errors.push('El nombre del contacto de emergencia es obligatorio y debe ser una cadena de texto');
    }

    if (!emailEmergencyContact || typeof emailEmergencyContact !== 'string') {
      errors.push('El correo electrónico es obligatorio y debe ser una cadena de texto');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEmergencyContact)) {
      errors.push('El correo electrónico debe ser válido');
    }

    if (!identifier || typeof identifier !== 'string') {
      errors.push('El identificador es obligatorio y debe ser una cadena de texto');
    }

    if (!status || !['active', 'inactive'].includes(status)) {
      errors.push('El estado debe ser "active" o "inactive"');
    }

    if (errors.length > 0) {
      return res.status(400).json({ ok: false, errors });
    }

    try {
      const newContact = await EmergencyContactsService.create({ nameEmergencyContact, emailEmergencyContact, identifier, status });
      res.status(201).json({ ok: true, data: newContact });
    } catch (err) {
      console.error('[EMERGENCY CONTACTS] error al crear:', err);
      res.status(500).json({ ok: false, message: 'Error al crear el contacto de emergencia' });
    }
  },

    // UPDATE an existing emergency contact by ID
    update: async (req, res) => {
    const idParam = req.params.idEmergencyContact;
    // Convert to number directly
    const id = Number(idParam);
    // If conversion fails or NaN, send error
    if (!Number.isInteger(id)) {
      return res.status(400).json({ ok: false, error: 'idEmergencyContact debe ser un número entero' });
    }

    // Check for empty or invalid JSON body
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ ok: false, error: 'Formato del JSON inválido o body vacío' });
    }

    const { nameEmergencyContact, emailEmergencyContact, identifier, status } = req.body;
    const errors = [];

    // Validate fields
    if (nameEmergencyContact !== undefined && typeof nameEmergencyContact !== 'string') {
      errors.push('El nombre del contacto de emergencia debe ser una cadena de texto');
    }
    if (emailEmergencyContact !== undefined) {
      if (typeof emailEmergencyContact !== 'string') errors.push('El correo electrónico debe ser una cadena de texto');
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEmergencyContact))
      errors.push('El correo electrónico debe ser válido');
    }
    if (identifier !== undefined) {
      if (typeof identifier !== 'string') errors.push('El identificador debe ser una cadena de texto');
    }
    if (status !== undefined && !['active', 'inactive'].includes(status))
      errors.push('El estado debe ser "active" o "inactive"');

    if (errors.length > 0) return res.status(400).json({ ok: false, errors });

    try {
      const updated = await EmergencyContactsService.update(id, req.body);
      if (!updated)
      return res.status(404).json({ ok: false, message: `No se encontró un contacto de emergencia con el ID ${id}` });

      res.json({ ok: true, data: updated });
    } catch (err) {
      if (err.code === 'P2025') {
      return res.status(404).json({ ok: false, message: `No se encontró un contacto de emergencia con el ID ${id}` });
      }
      console.error('[EMERGENCY CONTACTS] update error:', err);
      res.status(500).json({ ok: false, message: 'Error al actualizar el contacto de emergencia' });
    }
  },

  // DELETE /emergencyContacts/:idEmergencyContact - soft delete
  delete: async (req, res) => {
    const idParam = req.params.idEmergencyContact;

    // Validate that the ID contains only digits
  if (!/^\d+$/.test(idParam)) {
    return res.status(400).json({ ok: false, error: 'idEmergencyContact debe ser un número entero' });
  }

    const id = Number(idParam);

  try {
    const deleted = await EmergencyContactsService.softDelete(id); // softDelete cambia status a inactive
    res.json({ ok: true, data: deleted });
  } catch (err) {
    // Handle Prisma "record not found" error
    if (err.code === 'P2025') {
    return res.status(404).json({ ok: false, message: `No se encontró un contacto de emergencia con el ID ${id}` });
    }
    console.error('[EMERGENCY CONTACTS] error al eliminar:', err);
    res.status(500).json({ ok: false, message: 'Error al realizar la eliminación lógica del contacto de emergencia' });
  }
  },

};


// Export the controller for use in routes
module.exports = { EmergencyContactController };