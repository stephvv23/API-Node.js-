const { PhoneVolunteerService } = require('./phoneVolunteer.service');
const { VolunteerService } = require('../volunteer/volunteer.service');
const { PhoneService } = require('../phone/phone.service');
const { SecurityLogService } = require('../../../services/securitylog.service');
const { ValidationRules } = require('../../../utils/validator');

const PhoneVolunteerController = {
  /**
   * GET /api/volunteers/:id/phone
   * Get the phone for a volunteer (only one allowed)
   */
  get: async (req, res) => {
    const { id } = req.params;

    try {
      // Validate numeric id
      const idNum = ValidationRules.parseIdParam(String(id || ''));
      if (!idNum) return res.validationErrors(['El parámetro id debe ser numérico']);

      // Validate volunteer exists (don't return all volunteer data)
      const volunteer = await VolunteerService.findById(Number(idNum));
      if (!volunteer) {
        return res.notFound('Voluntario');
      }

      const phoneVolunteer = await PhoneVolunteerService.getByVolunteer(Number(idNum));
      
      if (!phoneVolunteer) {
        return res.success(null, 'El voluntario no tiene teléfono registrado');
      }

      return res.success(phoneVolunteer, 'Teléfono del voluntario obtenido exitosamente');
    } catch (error) {
      console.error('[PHONE-VOLUNTEER] get error:', error);
      return res.error('Error al obtener el teléfono del voluntario');
    }
  },

  /**
   * POST /api/volunteers/:id/phone
   * Add a phone to a volunteer (only if they don't have one)
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
      // Validate volunteer exists and is active
      const volunteer = await VolunteerService.findById(Number(idNum));
      if (!volunteer) {
        return res.notFound('Voluntario');
      }

      if (volunteer.status !== 'active') {
        return res.badRequest('No se pueden agregar teléfonos a un voluntario inactivo');
      }

      // Check if volunteer already has a phone
      const existingPhone = await PhoneVolunteerService.getByVolunteer(Number(idNum));
      
      if (existingPhone) {
        return res.badRequest(
          `El voluntario ya tiene un teléfono registrado (${existingPhone.phone.phone}). ` +
          `Use PUT para cambiarlo o DELETE para eliminarlo primero.`
        );
      }

      // Find or create phone (immutable phone record) using normalized string
      const phoneRecord = await PhoneService.findOrCreate(phoneStr);

      // Create relation
      const newPhoneVolunteer = await PhoneVolunteerService.create(Number(idNum), phoneRecord.idPhone);

      // Security log
      const userEmail = req.user?.sub;
      if (userEmail) {
        await SecurityLogService.log({
          email: userEmail,
          action: 'CREATE',
          description:
            `Se agregó el teléfono ${phoneStr} (ID Phone: ${phoneRecord.idPhone}) al voluntario "${volunteer.name}" (ID: ${id}).`,
          affectedTable: 'PhoneVolunteer'
        });
      }

      return res.status(201).success(newPhoneVolunteer, 'Teléfono agregado exitosamente');
    } catch (error) {
      console.error('[PHONE-VOLUNTEER] create error:', error);
      
      // Handle Prisma P2000 error (value too long for column)
      if (error.code === 'P2000') {
        const columnName = error.meta?.column_name || 'campo';
        return res.validationErrors([`El valor proporcionado para ${columnName} es demasiado largo`]);
      }
      
      return res.error('Error al agregar el teléfono al voluntario');
    }
  },

  /**
   * PUT /api/volunteers/:id/phone
   * Update (replace) the phone for a volunteer
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
      // Validate volunteer exists and is active
      const volunteer = await VolunteerService.findById(Number(idNum));
      if (!volunteer) {
        return res.notFound('Voluntario');
      }

      if (volunteer.status !== 'active') {
        return res.badRequest('No se pueden actualizar teléfonos de un voluntario inactivo');
      }

      // Check if volunteer has a phone
      const oldPhoneVolunteer = await PhoneVolunteerService.getByVolunteer(Number(idNum));
      
      if (!oldPhoneVolunteer) {
        return res.notFound('El voluntario no tiene un teléfono registrado. Use POST para agregar uno.');
      }

      // Find or create new phone using normalized string
      const newPhoneRecord = await PhoneService.findOrCreate(phoneStr);

      // Check if trying to update to the same phone
      if (oldPhoneVolunteer.idPhone === newPhoneRecord.idPhone) {
        return res.badRequest('El nuevo teléfono es el mismo que el actual');
      }

      // Step 1: Delete old phone relation
      await PhoneVolunteerService.deleteAllByVolunteer(Number(idNum));

      // Step 2: Create new phone relation
      const result = await PhoneVolunteerService.create(Number(idNum), newPhoneRecord.idPhone);

      // Security log
      const userEmail = req.user?.sub;
      if (userEmail) {
        await SecurityLogService.log({
          email: userEmail,
          action: 'UPDATE',
          description:
            `Se cambió el teléfono del voluntario "${volunteer.name}" (ID: ${id}). ` +
            `Teléfono anterior: ${oldPhoneVolunteer.phone.phone} (ID: ${oldPhoneVolunteer.idPhone}). ` +
            `Teléfono nuevo: ${phoneStr} (ID: ${newPhoneRecord.idPhone}).`,
          affectedTable: 'PhoneVolunteer'
        });
      }

      return res.success(result, 'Teléfono actualizado exitosamente');
    } catch (error) {
      console.error('[PHONE-VOLUNTEER] update error:', error);
      
      // Handle Prisma P2000 error (value too long for column)
      if (error.code === 'P2000') {
        const columnName = error.meta?.column_name || 'campo';
        return res.validationErrors([`El valor proporcionado para ${columnName} es demasiado largo`]);
      }
      
      return res.error('Error al actualizar el teléfono del voluntario');
    }
  },

  /**
   * DELETE /api/volunteers/:id/phone
   * Remove the phone from a volunteer
   */
  delete: async (req, res) => {
    const { id } = req.params;

    try {
      // Validate numeric id
      const idNum = ValidationRules.parseIdParam(String(id || ''));
      if (!idNum) return res.validationErrors(['El parámetro id debe ser numérico']);

      // Validate volunteer exists
      const volunteer = await VolunteerService.findById(Number(idNum));
      if (!volunteer) {
        return res.notFound('Voluntario');
      }

      // Check if volunteer has a phone
      const phoneVolunteer = await PhoneVolunteerService.getByVolunteer(Number(idNum));
      
      if (!phoneVolunteer) {
        return res.notFound('El voluntario no tiene un teléfono registrado');
      }

      // Delete relation
      await PhoneVolunteerService.deleteAllByVolunteer(Number(idNum));

      // Security log
      const userEmail = req.user?.sub;
      if (userEmail) {
        await SecurityLogService.log({
          email: userEmail,
          action: 'DELETE',
          description:
            `Se eliminó el teléfono ${phoneVolunteer.phone.phone} (ID: ${phoneVolunteer.idPhone}) del voluntario "${volunteer.name}" (ID: ${id}).`,
          affectedTable: 'PhoneVolunteer'
        });
      }

      return res.success(null, 'Teléfono eliminado exitosamente');
    } catch (error) {
      console.error('[PHONE-VOLUNTEER] delete error:', error);
      return res.error('Error al eliminar el teléfono del voluntario');
    }
  }
};

module.exports = { PhoneVolunteerController };
