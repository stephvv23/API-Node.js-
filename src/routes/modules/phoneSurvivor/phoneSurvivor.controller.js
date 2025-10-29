const { PhoneSurvivorService } = require('./phoneSurvivor.service');
const { SurvivorService } = require('../survivor/survivor.service');
const { PhoneService } = require('../phone/phone.service');
const { SecurityLogService } = require('../../../services/securitylog.service');

const PhoneSurvivorController = {
  /**
   * GET /api/survivors/:id/phone
   * Get the phone for a survivor (only one allowed)
   */
  get: async (req, res) => {
    const { id } = req.params;

    try {
      // Validate survivor exists
      const survivor = await SurvivorService.findById(id);
      if (!survivor) {
        return res.notFound('Superviviente');
      }

      const phoneSurvivor = await PhoneSurvivorService.getBySurvivor(id);
      
      if (!phoneSurvivor) {
        return res.success(null, 'El superviviente no tiene teléfono registrado');
      }

      return res.success(phoneSurvivor, 'Teléfono del superviviente obtenido exitosamente');
    } catch (error) {
      console.error('[PHONE-SURVIVOR] get error:', error);
      return res.error('Error al obtener el teléfono del superviviente');
    }
  },

  /**
   * POST /api/survivors/:id/phone
   * Add a phone to a survivor (only if they don't have one)
   * Body: { "phone": 50312345678 }
   * Automatically finds or creates the phone in the Phone table
   */
  create: async (req, res) => {
    const { id } = req.params;
    const { phone } = req.body;

    // Validations
    const errors = [];

    if (!phone) {
      errors.push('phone es requerido');
    } else if (typeof phone !== 'string' && typeof phone !== 'number') {
      errors.push('phone debe ser un string o número');
    } else {
      const phoneStr = String(phone);
      if (!/^\d+$/.test(phoneStr)) {
        errors.push('phone debe contener solo dígitos');
      } else if (phoneStr.length > 12) {
        errors.push('phone no puede tener más de 12 dígitos');
      }
    }

    if (errors.length > 0) {
      return res.validationErrors(errors);
    }

    try {
      // Validate survivor exists and is active
      const survivor = await SurvivorService.findById(id);
      if (!survivor) {
        return res.notFound('Superviviente');
      }

      if (survivor.status !== 'active') {
        return res.badRequest('No se pueden agregar teléfonos a un superviviente inactivo');
      }

      // Check if survivor already has a phone
      const existingPhone = await PhoneSurvivorService.getBySurvivor(id);
      
      if (existingPhone) {
        return res.badRequest(
          `El superviviente ya tiene un teléfono registrado (${existingPhone.phone.phone}). ` +
          `Use PUT para cambiarlo o DELETE para eliminarlo primero.`
        );
      }

      // Find or create phone (immutable phone record)
      const phoneRecord = await PhoneService.findOrCreate(phone);

      // Create relation
      const newPhoneSurvivor = await PhoneSurvivorService.create(id, phoneRecord.idPhone);

      // Security log
      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'CREATE',
        description:
          `Se agregó el teléfono ${phone} (ID Phone: ${phoneRecord.idPhone}) al superviviente "${survivor.survivorName}" (ID: ${id}).`,
        affectedTable: 'PhoneSurvivor'
      });

      return res.status(201).success(newPhoneSurvivor, 'Teléfono agregado exitosamente');
    } catch (error) {
      console.error('[PHONE-SURVIVOR] create error:', error);
      return res.error('Error al agregar el teléfono al superviviente');
    }
  },

  /**
   * PUT /api/survivors/:id/phone
   * Update (replace) the phone for a survivor
   * Body: { "phone": 50387654321 }
   * Automatically finds or creates the new phone and replaces the old one
   */
  update: async (req, res) => {
    const { id } = req.params;
    const { phone: newPhoneNumber } = req.body;

    // Validations
    const errors = [];

    if (!newPhoneNumber) {
      errors.push('phone es requerido');
    } else if (typeof newPhoneNumber !== 'string' && typeof newPhoneNumber !== 'number') {
      errors.push('phone debe ser un string o número');
    } else {
      const phoneStr = String(newPhoneNumber);
      if (!/^\d+$/.test(phoneStr)) {
        errors.push('phone debe contener solo dígitos');
      } else if (phoneStr.length > 12) {
        errors.push('phone no puede tener más de 12 dígitos');
      }
    }

    if (errors.length > 0) {
      return res.validationErrors(errors);
    }

    try {
      // Validate survivor exists and is active
      const survivor = await SurvivorService.findById(id);
      if (!survivor) {
        return res.notFound('Superviviente');
      }

      if (survivor.status !== 'active') {
        return res.badRequest('No se pueden actualizar teléfonos de un superviviente inactivo');
      }

      // Check if survivor has a phone
      const oldPhoneSurvivor = await PhoneSurvivorService.getBySurvivor(id);
      
      if (!oldPhoneSurvivor) {
        return res.notFound('El superviviente no tiene un teléfono registrado. Use POST para agregar uno.');
      }

      // Find or create new phone
      const newPhoneRecord = await PhoneService.findOrCreate(newPhoneNumber);

      // Check if trying to update to the same phone
      if (oldPhoneSurvivor.idPhone === newPhoneRecord.idPhone) {
        return res.badRequest('El nuevo teléfono es el mismo que el actual');
      }

      // Step 1: Delete old phone relation
      await PhoneSurvivorService.deleteAllBySurvivor(id);

      // Step 2: Create new phone relation
      const result = await PhoneSurvivorService.create(id, newPhoneRecord.idPhone);

      // Security log
      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'UPDATE',
        description:
          `Se cambió el teléfono del superviviente "${survivor.survivorName}" (ID: ${id}). ` +
          `Teléfono anterior: ${oldPhoneSurvivor.phone.phone} (ID: ${oldPhoneSurvivor.idPhone}). ` +
          `Teléfono nuevo: ${newPhoneNumber} (ID: ${newPhoneRecord.idPhone}).`,
        affectedTable: 'PhoneSurvivor'
      });

      return res.success(result, 'Teléfono actualizado exitosamente');
    } catch (error) {
      console.error('[PHONE-SURVIVOR] update error:', error);
      return res.error('Error al actualizar el teléfono del superviviente');
    }
  },

  /**
   * DELETE /api/survivors/:id/phone
   * Remove the phone from a survivor
   */
  delete: async (req, res) => {
    const { id } = req.params;

    try {
      // Validate survivor exists
      const survivor = await SurvivorService.findById(id);
      if (!survivor) {
        return res.notFound('Superviviente');
      }

      // Check if survivor has a phone
      const phoneSurvivor = await PhoneSurvivorService.getBySurvivor(id);
      
      if (!phoneSurvivor) {
        return res.notFound('El superviviente no tiene un teléfono registrado');
      }

      // Delete relation
      await PhoneSurvivorService.deleteAllBySurvivor(id);

      // Security log
      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'DELETE',
        description:
          `Se eliminó el teléfono ${phoneSurvivor.phone.phone} (ID: ${phoneSurvivor.idPhone}) del superviviente "${survivor.survivorName}" (ID: ${id}).`,
        affectedTable: 'PhoneSurvivor'
      });

      return res.success(null, 'Teléfono eliminado exitosamente');
    } catch (error) {
      console.error('[PHONE-SURVIVOR] delete error:', error);
      return res.error('Error al eliminar el teléfono del superviviente');
    }
  }
};

module.exports = { PhoneSurvivorController };

