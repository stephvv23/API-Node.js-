const { PhoneSurvivorService } = require('./phoneSurvivor.service');
const { SurvivorService } = require('../survivor/survivor.service');
const { PhoneService } = require('../phone/phone.service');
const { SecurityLogService } = require('../../../services/securitylog.service');
const { ValidationRules } = require('../../../utils/validator');

const PhoneSurvivorController = {
  /**
   * GET /api/survivors/:id/phone
   * Get the phone for a survivor (only one allowed)
   */
  get: async (req, res) => {
    const { id } = req.params;

    try {
      // Validate numeric id
      const idNum = ValidationRules.parseIdParam(String(id || ''));
      if (!idNum) return res.validationErrors(['El parámetro id debe ser numérico']);

      // Validate survivor exists (don't return all survivor data)
      const survivor = await SurvivorService.findById(Number(idNum));
      if (!survivor) {
        return res.notFound('Superviviente');
      }

      const phoneSurvivor = await PhoneSurvivorService.getBySurvivor(Number(idNum));
      
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
      // Validate survivor exists and is active
      const survivor = await SurvivorService.findById(Number(idNum));
      if (!survivor) {
        return res.notFound('Superviviente');
      }

      if (survivor.status !== 'active') {
        return res.badRequest('No se pueden agregar teléfonos a un superviviente inactivo');
      }

      // Check if survivor already has a phone
      const existingPhone = await PhoneSurvivorService.getBySurvivor(Number(idNum));
      
      if (existingPhone) {
        return res.badRequest(
          `El superviviente ya tiene un teléfono registrado (${existingPhone.phone.phone}). ` +
          `Use PUT para cambiarlo o DELETE para eliminarlo primero.`
        );
      }

      // Find or create phone (immutable phone record) using normalized string
      const phoneRecord = await PhoneService.findOrCreate(phoneStr);

      // Create relation
      const newPhoneSurvivor = await PhoneSurvivorService.create(Number(idNum), phoneRecord.idPhone);

      // Security log
      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'CREATE',
        description:
          `Se agregó el teléfono ${phoneStr} (ID Phone: ${phoneRecord.idPhone}) al superviviente "${survivor.survivorName}" (ID: ${id}).`,
        affectedTable: 'PhoneSurvivor'
      });

      return res.status(201).success(newPhoneSurvivor, 'Teléfono agregado exitosamente');
    } catch (error) {
      console.error('[PHONE-SURVIVOR] create error:', error);
      
      // Handle Prisma P2000 error (value too long for column)
      if (error.code === 'P2000') {
        const columnName = error.meta?.column_name || 'campo';
        return res.validationErrors([`El valor proporcionado para ${columnName} es demasiado largo`]);
      }
      
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
      // Validate survivor exists and is active
      const survivor = await SurvivorService.findById(Number(idNum));
      if (!survivor) {
        return res.notFound('Superviviente');
      }

      if (survivor.status !== 'active') {
        return res.badRequest('No se pueden actualizar teléfonos de un superviviente inactivo');
      }

      // Check if survivor has a phone
      const oldPhoneSurvivor = await PhoneSurvivorService.getBySurvivor(Number(idNum));
      
      if (!oldPhoneSurvivor) {
        return res.notFound('El superviviente no tiene un teléfono registrado. Use POST para agregar uno.');
      }

      // Find or create new phone using normalized string
      const newPhoneRecord = await PhoneService.findOrCreate(phoneStr);

      // Check if trying to update to the same phone
      if (oldPhoneSurvivor.idPhone === newPhoneRecord.idPhone) {
        return res.badRequest('El nuevo teléfono es el mismo que el actual');
      }

      // Step 1: Delete old phone relation
      await PhoneSurvivorService.deleteAllBySurvivor(Number(idNum));

      // Step 2: Create new phone relation
      const result = await PhoneSurvivorService.create(Number(idNum), newPhoneRecord.idPhone);

      // Security log
      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'UPDATE',
        description:
          `Se cambió el teléfono del superviviente "${survivor.survivorName}" (ID: ${id}). ` +
          `Teléfono anterior: ${oldPhoneSurvivor.phone.phone} (ID: ${oldPhoneSurvivor.idPhone}). ` +
          `Teléfono nuevo: ${phoneStr} (ID: ${newPhoneRecord.idPhone}).`,
        affectedTable: 'PhoneSurvivor'
      });

      return res.success(result, 'Teléfono actualizado exitosamente');
    } catch (error) {
      console.error('[PHONE-SURVIVOR] update error:', error);
      
      // Handle Prisma P2000 error (value too long for column)
      if (error.code === 'P2000') {
        const columnName = error.meta?.column_name || 'campo';
        return res.validationErrors([`El valor proporcionado para ${columnName} es demasiado largo`]);
      }
      
      return res.error('Error al actualizar el teléfono del superviviente');
    }
  },

  /**
   * DELETE /api/survivors/:id/phone
   * Remove the phone from a survivor
   * COMMENTED OUT - We don't delete phone numbers, only update them
   */
  // delete: async (req, res) => {
  //   const { id } = req.params;

  //   try {
  //     // Validate numeric id
  //     const idNum = ValidationRules.parseIdParam(String(id || ''));
  //     if (!idNum) return res.validationErrors(['El parámetro id debe ser numérico']);

  //     // Validate survivor exists
  //     const survivor = await SurvivorService.findById(Number(idNum));
  //     if (!survivor) {
  //       return res.notFound('Superviviente');
  //     }

  //     // Check if survivor has a phone
  //     const phoneSurvivor = await PhoneSurvivorService.getBySurvivor(Number(idNum));
      
  //     if (!phoneSurvivor) {
  //       return res.notFound('El superviviente no tiene un teléfono registrado');
  //     }

  //     // Delete relation
  //     await PhoneSurvivorService.deleteAllBySurvivor(Number(idNum));

  //     // Security log
  //     const userEmail = req.user?.sub;
  //     await SecurityLogService.log({
  //       email: userEmail,
  //       action: 'DELETE',
  //       description:
  //         `Se eliminó el teléfono ${phoneSurvivor.phone.phone} (ID: ${phoneSurvivor.idPhone}) del superviviente "${survivor.survivorName}" (ID: ${id}).`,
  //       affectedTable: 'PhoneSurvivor'
  //     });

  //     return res.success(null, 'Teléfono eliminado exitosamente');
  //   } catch (error) {
  //     console.error('[PHONE-SURVIVOR] delete error:', error);
  //     return res.error('Error al eliminar el teléfono del superviviente');
  //   }
  // }
};

module.exports = { PhoneSurvivorController };

