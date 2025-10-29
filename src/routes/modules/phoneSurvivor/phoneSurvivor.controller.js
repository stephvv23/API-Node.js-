const { PhoneSurvivorService } = require('./phoneSurvivor.service');
const { SurvivorService } = require('../survivor/survivor.service');
const { PhoneService } = require('../phone/phone.service');
const { SecurityLogService } = require('../../../services/securitylog.service');

const PhoneSurvivorController = {
  /**
   * GET /api/survivors/:id/phones
   * List all phones for a specific survivor
   */
  list: async (req, res) => {
    const { id } = req.params;

    try {
      // Validate survivor exists
      const survivor = await SurvivorService.findById(id);
      if (!survivor) {
        return res.notFound('Superviviente');
      }

      const phones = await PhoneSurvivorService.getBySurvivor(id);
      return res.success(phones, 'Teléfonos del superviviente obtenidos exitosamente');
    } catch (error) {
      console.error('[PHONE-SURVIVOR] list error:', error);
      return res.error('Error al obtener los teléfonos del superviviente');
    }
  },

  /**
   * GET /api/survivors/:id/phones/:idPhone
   * Get a specific phone for a survivor
   */
  getOne: async (req, res) => {
    const { id, idPhone } = req.params;

    try {
      // Validate survivor exists
      const survivor = await SurvivorService.findById(id);
      if (!survivor) {
        return res.notFound('Superviviente');
      }

      const phoneSurvivor = await PhoneSurvivorService.findOne(id, idPhone);
      
      if (!phoneSurvivor) {
        return res.notFound('El superviviente no tiene registrado este teléfono');
      }

      return res.success(phoneSurvivor, 'Teléfono del superviviente obtenido exitosamente');
    } catch (error) {
      console.error('[PHONE-SURVIVOR] getOne error:', error);
      return res.error('Error al obtener el teléfono del superviviente');
    }
  },

  /**
   * POST /api/survivors/:id/phones
   * Add a phone to a survivor
   * Body: { "phone": 50312345678 }
   * Automatically finds or creates the phone in the Phone table
   */
  create: async (req, res) => {
    const { id } = req.params;
    const { phone } = req.body;

    // Validations
    const errors = [];

    if (!phone || typeof phone !== 'number') {
      errors.push('phone es requerido y debe ser un número');
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

      // Find or create phone (immutable phone record)
      const phoneRecord = await PhoneService.findOrCreate(phone);

      // Check if relation already exists
      const existing = await PhoneSurvivorService.findOne(id, phoneRecord.idPhone);
      
      if (existing) {
        return res.validationErrors([
          `El superviviente ya tiene registrado el teléfono ${phone}.`
        ]);
      }

      // Create new relation
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
   * PUT /api/survivors/:id/phones/:idPhone
   * Update (change) a phone for a survivor
   * Body: { "idPhone": 5 }
   * This will:
   * 1. Delete the old phone relation
   * 2. Create the new phone relation
   * Note: The phone must already exist in the Phone table
   */
  update: async (req, res) => {
    const { id, idPhone } = req.params;
    const { idPhone: newIdPhone } = req.body;

    // Validations
    const errors = [];

    if (!newIdPhone || typeof newIdPhone !== 'number') {
      errors.push('idPhone es requerido y debe ser un número');
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

      // Validate old phone-survivor relation exists
      const oldPhoneSurvivor = await PhoneSurvivorService.findOne(id, idPhone);
      if (!oldPhoneSurvivor) {
        return res.notFound('El superviviente no tiene registrado este teléfono');
      }

      // Check if trying to update to the same phone
      if (Number(idPhone) === Number(newIdPhone)) {
        return res.badRequest('El nuevo teléfono es el mismo que el actual');
      }

      // Validate new phone exists
      const newPhone = await PhoneService.findById(newIdPhone);
      if (!newPhone) {
        return res.validationErrors([
          `El teléfono con ID ${newIdPhone} no existe. Debe crearlo primero o usar el número en el POST.`
        ]);
      }

      // Check if new phone relation already exists for this survivor
      const existingNewRelation = await PhoneSurvivorService.findOne(id, newIdPhone);
      
      if (existingNewRelation) {
        return res.validationErrors([
          `El superviviente ya tiene registrado el teléfono ${newPhone.phone}.`
        ]);
      }

      // Step 1: Delete old phone relation
      await PhoneSurvivorService.delete(id, idPhone);

      // Step 2: Create new phone relation
      const result = await PhoneSurvivorService.create(id, newIdPhone);

      // Security log
      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'UPDATE',
        description:
          `Se cambió el teléfono del superviviente "${survivor.survivorName}" (ID: ${id}). ` +
          `Teléfono anterior: ${oldPhoneSurvivor.phone.phone} (ID: ${idPhone}). ` +
          `Teléfono nuevo: ${newPhone.phone} (ID: ${newIdPhone}).`,
        affectedTable: 'PhoneSurvivor'
      });

      return res.success(result, 'Teléfono actualizado exitosamente');
    } catch (error) {
      console.error('[PHONE-SURVIVOR] update error:', error);
      return res.error('Error al actualizar el teléfono del superviviente');
    }
  },

  /**
   * DELETE /api/survivors/:id/phones/:idPhone
   * Remove a phone from a survivor (hard delete)
   */
  delete: async (req, res) => {
    const { id, idPhone } = req.params;

    try {
      // Validate survivor exists
      const survivor = await SurvivorService.findById(id);
      if (!survivor) {
        return res.notFound('Superviviente');
      }

      // Validate phone-survivor relation exists
      const phoneSurvivor = await PhoneSurvivorService.findOne(id, idPhone);
      if (!phoneSurvivor) {
        return res.notFound('El superviviente no tiene registrado este teléfono');
      }

      // Hard delete
      await PhoneSurvivorService.delete(id, idPhone);

      // Security log
      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'DELETE',
        description:
          `Se eliminó el teléfono ${phoneSurvivor.phone.phone} (ID: ${idPhone}) del superviviente "${survivor.survivorName}" (ID: ${id}).`,
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
