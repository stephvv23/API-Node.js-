const { EmergencyContactPhoneService } = require('./emergencyContactPhone.service');
const { EmergencyContactsService } = require('../emergencyContact/emergencyContact.service');
const { PhoneService } = require('../phone/phone.service');
const { SecurityLogService } = require('../../../services/securitylog.service');
const { ValidationRules } = require('../../../utils/validator');

const EmergencyContactPhoneController = {
  /**
   * GET /api/emergency-contacts/:id/phone
   * Get the phone for an emergency contact (only one allowed)
   */
  get: async (req, res) => {
    const { id } = req.params;

    try {
      // Validate numeric id
      const idNum = ValidationRules.parseIdParam(String(id || ''));
      if (!idNum) return res.validationErrors(['El parámetro id debe ser numérico']);

      // Validate emergency contact exists
      const emergencyContact = await EmergencyContactsService.get(Number(idNum));
      if (!emergencyContact) {
        return res.notFound('Contacto de emergencia');
      }

      const emergencyContactPhone = await EmergencyContactPhoneService.getByEmergencyContact(Number(idNum));
      
      if (!emergencyContactPhone) {
        return res.success(null, 'El contacto de emergencia no tiene teléfono registrado');
      }

      return res.success(emergencyContactPhone, 'Teléfono del contacto de emergencia obtenido exitosamente');
    } catch (error) {
      console.error('[EMERGENCY-CONTACT-PHONE] get error:', error);
      return res.error('Error al obtener el teléfono del contacto de emergencia');
    }
  },

  /**
   * POST /api/emergency-contacts/:id/phone
   * Add a phone to an emergency contact (only if they don't have one)
   * Body: { "phone": 50312345678 }
   * Automatically finds or creates the phone in the Phone table
   */
  create: async (req, res) => {
    const { id } = req.params;
    
    // Check for JSON parsing errors
    if (req.body.__jsonError) {
      return res.validationErrors([req.body.__jsonErrorMessage || 'Formato de JSON inválido']);
    }

    const { phone } = req.body;

    // Validations
    const errors = [];

    const idNum = ValidationRules.parseIdParam(String(id || ''));
    if (!idNum) errors.push('El parámetro id debe ser numérico');

    // Validate phone using validator
    const phoneValidation = ValidationRules.parsePhoneNumber(phone);
    if (!phoneValidation.valid) {
      errors.push(...phoneValidation.errors);
    }

    if (errors.length > 0) {
      return res.validationErrors(errors);
    }

    const phoneStr = phoneValidation.value;

    try {
      // Validate emergency contact exists and is active
      const emergencyContact = await EmergencyContactsService.get(Number(idNum));
      if (!emergencyContact) {
        return res.notFound('Contacto de emergencia');
      }

      if (emergencyContact.status !== 'active') {
        return res.badRequest('No se pueden agregar teléfonos a un contacto de emergencia inactivo');
      }

      // Check if emergency contact already has a phone
      const existingPhone = await EmergencyContactPhoneService.getByEmergencyContact(Number(idNum));
      
      if (existingPhone) {
        return res.badRequest(
          `El contacto de emergencia ya tiene un teléfono registrado (${existingPhone.phone.phone}). ` +
          `Use PUT para cambiarlo o DELETE para eliminarlo primero.`
        );
      }

      // Find or create phone (immutable phone record) using normalized string
      const phoneRecord = await PhoneService.findOrCreate(phoneStr);

      // Create relation
      const newEmergencyContactPhone = await EmergencyContactPhoneService.create(Number(idNum), phoneRecord.idPhone);

      // Security log
      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'CREATE',
        description:
          `Se agregó el teléfono ${phoneStr} (ID Phone: ${phoneRecord.idPhone}) al contacto de emergencia "${emergencyContact.nameEmergencyContact}" (ID: ${id}).`,
        affectedTable: 'PhoneEmergencyContact'
      });

      return res.status(201).success(newEmergencyContactPhone, 'Teléfono agregado exitosamente');
    } catch (error) {
      console.error('[EMERGENCY-CONTACT-PHONE] create error:', error);
      
      // Handle Prisma P2000 error (value too long for column)
      if (error.code === 'P2000') {
        const columnName = error.meta?.column_name || 'campo';
        return res.validationErrors([`El valor proporcionado para ${columnName} es demasiado largo`]);
      }
      
      return res.error('Error al agregar el teléfono al contacto de emergencia');
    }
  },

  /**
   * PUT /api/emergency-contacts/:id/phone
   * Update (replace) the phone for an emergency contact
   * Body: { "phone": 50387654321 }
   * Automatically finds or creates the new phone and replaces the old one
   */
  update: async (req, res) => {
    const { id } = req.params;
    
    // Check for JSON parsing errors
    if (req.body.__jsonError) {
      return res.validationErrors([req.body.__jsonErrorMessage || 'Formato de JSON inválido']);
    }

    const { phone: newPhoneNumber } = req.body;

    // Validations
    const errors = [];

    const idNum = ValidationRules.parseIdParam(String(id || ''));
    if (!idNum) errors.push('El parámetro id debe ser numérico');

    // Validate phone using validator
    const phoneValidation = ValidationRules.parsePhoneNumber(newPhoneNumber);
    if (!phoneValidation.valid) {
      errors.push(...phoneValidation.errors);
    }

    if (errors.length > 0) {
      return res.validationErrors(errors);
    }

    const phoneStr = phoneValidation.value;

    try {
      // Validate emergency contact exists and is active
      const emergencyContact = await EmergencyContactsService.get(Number(idNum));
      if (!emergencyContact) {
        return res.notFound('Contacto de emergencia');
      }

      if (emergencyContact.status !== 'active') {
        return res.badRequest('No se pueden actualizar teléfonos de un contacto de emergencia inactivo');
      }

      // Check if emergency contact has a phone
      const oldEmergencyContactPhone = await EmergencyContactPhoneService.getByEmergencyContact(Number(idNum));
      
      if (!oldEmergencyContactPhone) {
        return res.notFound('El contacto de emergencia no tiene un teléfono registrado. Use POST para agregar uno.');
      }

      // Find or create new phone using normalized string
      const newPhoneRecord = await PhoneService.findOrCreate(phoneStr);

      // Check if trying to update to the same phone
      if (oldEmergencyContactPhone.idPhone === newPhoneRecord.idPhone) {
        return res.badRequest('El nuevo teléfono es el mismo que el actual');
      }

      // Step 1: Delete old phone relation
      await EmergencyContactPhoneService.deleteAllByEmergencyContact(Number(idNum));

      // Step 2: Create new phone relation
      const result = await EmergencyContactPhoneService.create(Number(idNum), newPhoneRecord.idPhone);

      // Security log
      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'UPDATE',
        description:
          `Se cambió el teléfono del contacto de emergencia "${emergencyContact.nameEmergencyContact}" (ID: ${id}). ` +
          `Teléfono anterior: ${oldEmergencyContactPhone.phone.phone} (ID: ${oldEmergencyContactPhone.idPhone}). ` +
          `Teléfono nuevo: ${phoneStr} (ID: ${newPhoneRecord.idPhone}).`,
        affectedTable: 'PhoneEmergencyContact'
      });

      return res.success(result, 'Teléfono actualizado exitosamente');
    } catch (error) {
      console.error('[EMERGENCY-CONTACT-PHONE] update error:', error);
      
      // Handle Prisma P2000 error (value too long for column)
      if (error.code === 'P2000') {
        const columnName = error.meta?.column_name || 'campo';
        return res.validationErrors([`El valor proporcionado para ${columnName} es demasiado largo`]);
      }
      
      return res.error('Error al actualizar el teléfono del contacto de emergencia');
    }
  },

  /**
   * DELETE /api/emergency-contacts/:id/phone
   * Remove the phone from an emergency contact
   */
  delete: async (req, res) => {
    const { id } = req.params;

    try {
      // Validate numeric id
      const idNum = ValidationRules.parseIdParam(String(id || ''));
      if (!idNum) return res.validationErrors(['El parámetro id debe ser numérico']);

      // Validate emergency contact exists
      const emergencyContact = await EmergencyContactsService.get(Number(idNum));
      if (!emergencyContact) {
        return res.notFound('Contacto de emergencia');
      }

      // Check if emergency contact has a phone
      const emergencyContactPhone = await EmergencyContactPhoneService.getByEmergencyContact(Number(idNum));
      
      if (!emergencyContactPhone) {
        return res.notFound('El contacto de emergencia no tiene un teléfono registrado');
      }

      // Delete relation
      await EmergencyContactPhoneService.deleteAllByEmergencyContact(Number(idNum));

      // Security log
      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'DELETE',
        description:
          `Se eliminó el teléfono ${emergencyContactPhone.phone.phone} (ID: ${emergencyContactPhone.idPhone}) del contacto de emergencia "${emergencyContact.nameEmergencyContact}" (ID: ${id}).`,
        affectedTable: 'PhoneEmergencyContact'
      });

      return res.success(null, 'Teléfono eliminado exitosamente');
    } catch (error) {
      console.error('[EMERGENCY-CONTACT-PHONE] delete error:', error);
      return res.error('Error al eliminar el teléfono del contacto de emergencia');
    }
  }
};

module.exports = { EmergencyContactPhoneController };
