const { PhoneHeadquarterService } = require('./phoneHeadquarter.service');
const { HeadquarterService } = require('../headquarters/headquarter.service');
const { PhoneService } = require('../phone/phone.service');
const { SecurityLogService } = require('../../../services/securitylog.service');
const { ValidationRules } = require('../../../utils/validator');

const PhoneHeadquarterController = {
  /**
   * GET /api/headquarters/:id/phone
   * Get the phone for a headquarter (only one allowed)
   */
  get: async (req, res) => {
    const { id } = req.params;
    try {
      const idNum = ValidationRules.parseIdParam(String(id || ''));
      if (!idNum) return res.validationErrors(['El parámetro id debe ser numérico']);

      const headquarter = await HeadquarterService.findById(Number(idNum));
      if (!headquarter) {
        return res.notFound('Sede');
      }

      const phoneHeadquarter = await PhoneHeadquarterService.getByHeadquarter(Number(idNum));
      
      if (!phoneHeadquarter) {
        return res.success(null, 'La sede no tiene teléfono registrado');
      }

      return res.success(phoneHeadquarter, 'Teléfono de la sede obtenido exitosamente');
    } catch (error) {
      console.error('[PHONE-HEADQUARTER] get error:', error);
      return res.error('Error al obtener el teléfono de la sede');
    }
  },

  /**
   * POST /api/headquarters/:id/phone
   * Add a phone to a headquarter (only if they don't have one)
   * Body: { "phone": 50312345678 }
   */
  create: async (req, res) => {
    const { id } = req.params;
    
    if (req.body.__jsonError) {
      return res.validationErrors([req.body.__jsonErrorMessage || 'Formato de JSON inválido']);
    }

    const { phone } = req.body;

    const errors = [];
    const idNum = ValidationRules.parseIdParam(String(id || ''));
    if (!idNum) errors.push('El parámetro id debe ser numérico');

    const phoneValidation = ValidationRules.parsePhoneNumber(phone);
    if (!phoneValidation.valid) {
      errors.push(...phoneValidation.errors);
    }

    if (errors.length > 0) {
      return res.validationErrors(errors);
    }

    const phoneStr = phoneValidation.value;

    try {
      const headquarter = await HeadquarterService.findById(Number(idNum));
      if (!headquarter) {
        return res.notFound('Sede');
      }

      if (headquarter.status !== 'active') {
        return res.badRequest('No se pueden agregar teléfonos a una sede inactiva');
      }

      // Check if headquarter already has a phone
      const existingPhone = await PhoneHeadquarterService.getByHeadquarter(Number(idNum));
      
      if (existingPhone) {
        return res.badRequest(
          `La sede ya tiene un teléfono registrado (${existingPhone.phone.phone}). ` +
          `Use PUT para cambiarlo o DELETE para eliminarlo primero.`
        );
      }

      const phoneRecord = await PhoneService.findOrCreate(phoneStr);

      const newPhoneHeadquarter = await PhoneHeadquarterService.create(Number(idNum), phoneRecord.idPhone);

      const userEmail = req.user?.sub;
      if (userEmail) {
        await SecurityLogService.log({
          email: userEmail,
          action: 'CREATE',
          description: `Se agregó el teléfono ${phoneStr} (ID Phone: ${phoneRecord.idPhone}) a la sede "${headquarter.name}" (ID: ${idNum}).`,
          affectedTable: 'PhoneHeadquarter'
        });
      }

      return res.status(201).success(newPhoneHeadquarter, 'Teléfono agregado exitosamente');
    } catch (error) {
      console.error('[PHONE-HEADQUARTER] create error:', error);
      
      if (error.code === 'P2000') {
        const columnName = error.meta?.column_name || 'campo';
        return res.validationErrors([`El valor proporcionado para ${columnName} es demasiado largo`]);
      }
      
      return res.error('Error al agregar el teléfono a la sede');
    }
  },

  /**
   * PUT /api/headquarters/:id/phone
   * Update (replace) phone for headquarter
   * Body: { "phone": 50387654321 }
   */
  update: async (req, res) => {
    const { id } = req.params;
    
    if (req.body.__jsonError) {
      return res.validationErrors([req.body.__jsonErrorMessage || 'Formato de JSON inválido']);
    }

    const { phone: newPhoneNumber } = req.body;

    const errors = [];
    const idNum = ValidationRules.parseIdParam(String(id || ''));
    if (!idNum) errors.push('El parámetro id debe ser numérico');

    const phoneValidation = ValidationRules.parsePhoneNumber(newPhoneNumber);
    if (!phoneValidation.valid) {
      errors.push(...phoneValidation.errors);
    }

    if (errors.length > 0) {
      return res.validationErrors(errors);
    }

    const phoneStr = phoneValidation.value;

    try {
      const headquarter = await HeadquarterService.findById(Number(idNum));
      if (!headquarter) {
        return res.notFound('Sede');
      }

      if (headquarter.status !== 'active') {
        return res.badRequest('No se pueden actualizar teléfonos de una sede inactiva');
      }

      const oldPhoneHeadquarter = await PhoneHeadquarterService.getByHeadquarter(Number(idNum));
      
      if (!oldPhoneHeadquarter) {
        return res.notFound('La sede no tiene un teléfono registrado. Use POST para agregar uno.');
      }

      const newPhoneRecord = await PhoneService.findOrCreate(phoneStr);

      if (oldPhoneHeadquarter.idPhone === newPhoneRecord.idPhone) {
        return res.badRequest('El nuevo teléfono es el mismo que el actual');
      }

      await PhoneHeadquarterService.deleteAllByHeadquarter(Number(idNum));
      const result = await PhoneHeadquarterService.create(Number(idNum), newPhoneRecord.idPhone);

      const userEmail = req.user?.sub;
      if (userEmail) {
        await SecurityLogService.log({
          email: userEmail,
          action: 'UPDATE',
          description:
            `Se cambió el teléfono de la sede "${headquarter.name}" (ID: ${idNum}). ` +
            `Teléfono anterior: ${oldPhoneHeadquarter.phone.phone} (ID: ${oldPhoneHeadquarter.idPhone}). ` +
            `Teléfono nuevo: ${phoneStr} (ID: ${newPhoneRecord.idPhone}).`,
          affectedTable: 'PhoneHeadquarter'
        });
      }

      return res.success(result, 'Teléfono actualizado exitosamente');
    } catch (error) {
      console.error('[PHONE-HEADQUARTER] update error:', error);
      
      if (error.code === 'P2000') {
        const columnName = error.meta?.column_name || 'campo';
        return res.validationErrors([`El valor proporcionado para ${columnName} es demasiado largo`]);
      }
      
      return res.error('Error al actualizar el teléfono de la sede');
    }
  },

  /**
   * DELETE /api/headquarters/:id/phone
   * Remove the phone from a headquarter
   */
  delete: async (req, res) => {
    const { id } = req.params;

    try {
      const idNum = ValidationRules.parseIdParam(String(id || ''));
      if (!idNum) return res.validationErrors(['El parámetro id debe ser numérico']);

      const headquarter = await HeadquarterService.findById(Number(idNum));
      if (!headquarter) {
        return res.notFound('Sede');
      }

      const phoneHeadquarter = await PhoneHeadquarterService.getByHeadquarter(Number(idNum));
      
      if (!phoneHeadquarter) {
        return res.notFound('La sede no tiene un teléfono registrado');
      }

      await PhoneHeadquarterService.deleteAllByHeadquarter(Number(idNum));

      const userEmail = req.user?.sub;
      if (userEmail) {
        await SecurityLogService.log({
          email: userEmail,
          action: 'DELETE',
          description: `Se eliminó el teléfono ${phoneHeadquarter.phone.phone} (ID: ${phoneHeadquarter.idPhone}) de la sede "${headquarter.name}" (ID: ${idNum}).`,
          affectedTable: 'PhoneHeadquarter'
        });
      }

      return res.success(null, 'Teléfono eliminado exitosamente');
    } catch (error) {
      console.error('[PHONE-HEADQUARTER] delete error:', error);
      return res.error('Error al eliminar el teléfono de la sede');
    }
  }
};

module.exports = { PhoneHeadquarterController };
