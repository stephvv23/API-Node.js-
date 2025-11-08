const { PhoneGodparentService } = require('./phoneGodparent.service');
const { GodParentService } = require('../GodParent/godparent.service');
const { PhoneService } = require('../phone/phone.service');
const { SecurityLogService } = require('../../../services/securitylog.service');
const { ValidationRules } = require('../../../utils/validator');

const PhoneGodparentController = {
  /**
   * GET /api/godparents/:id/phone
   * Get the phone for a godparent (only one allowed)
   */
  get: async (req, res) => {
    const { id } = req.params;
    try {
      const idNum = ValidationRules.parseIdParam(String(id || ''));
      if (!idNum) return res.validationErrors(['El parámetro id debe ser numérico']);
  const godparent = await GodParentService.findById(Number(idNum));
      if (!godparent) {
        return res.notFound('Padrino');
      }
      const phoneGodparent = await PhoneGodparentService.getByGodparent(Number(idNum));
      if (!phoneGodparent) {
        return res.success(null, 'El padrino no tiene teléfono registrado');
      }
      return res.success(phoneGodparent, 'Teléfono del padrino obtenido exitosamente');
    } catch (error) {
      console.error('[PHONE-GODPARENT] get error:', error);
      return res.error('Error al obtener el teléfono del padrino');
    }
  },

  /**
   * POST /api/godparents/:id/phone
   * Add a phone to a godparent (only if they don't have one)
   * Body: { "phone": 50312345678 }
   * Automatically finds or creates the phone in the Phone table
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
      const godparent = await GodParentService.findById(Number(idNum));
      if (!godparent) return res.notFound('Padrino');
      
      const phoneGodparent = await PhoneGodparentService.getByGodparent(Number(idNum));
      if (phoneGodparent) {
        return res.badRequest(
          `El padrino ya tiene un teléfono registrado (${phoneGodparent.phone.phone}). ` +
          `Use PUT para cambiarlo o DELETE para eliminarlo primero.`
        );
      }
      
      const phoneObj = await PhoneService.findOrCreate(phoneStr);
      const created = await PhoneGodparentService.create(Number(idNum), phoneObj.idPhone);
      // Security log
      const userEmail = req.user?.sub;
      if (userEmail) {
        await SecurityLogService.log({
          email: userEmail,
          action: 'CREATE',
          description: `Se agregó el teléfono ${phoneObj.phone} (ID Phone: ${phoneObj.idPhone}) al padrino "${godparent.name}" (ID: ${idNum}).`,
          affectedTable: 'PhoneGodparent'
        });
      }
      return res.success(created, 'Teléfono agregado al padrino exitosamente');
    } catch (error) {
      console.error('[PHONE-GODPARENT] create error:', error);
      return res.error('Error al agregar el teléfono al padrino');
    }
  },

  /**
   * PUT /api/godparents/:id/phone
   * Update (replace) phone for godparent
   * Body: { "phone": 50387654321 }
   */
  update: async (req, res) => {
    const { id } = req.params;
    if (req.body.__jsonError) {
      return res.validationErrors([req.body.__jsonErrorMessage || 'Formato de JSON inválido']);
    }
    const { phone } = req.body;
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
      const godparent = await GodParentService.findById(Number(idNum));
      if (!godparent) return res.notFound('Padrino');
      
      await PhoneGodparentService.deleteAllByGodparent(Number(idNum));
      const phoneObj = await PhoneService.findOrCreate(phoneStr);
      const created = await PhoneGodparentService.create(Number(idNum), phoneObj.idPhone);
      const userEmailUpdate = req.user?.sub;
      if (userEmailUpdate) {
        await SecurityLogService.log({
          email: userEmailUpdate,
          action: 'UPDATE',
          description: `Se cambió el teléfono del padrino "${godparent.name}" (ID: ${idNum}). Teléfono nuevo: ${phoneObj.phone} (ID: ${phoneObj.idPhone}).`,
          affectedTable: 'PhoneGodparent'
        });
      }
      return res.success(created, 'Teléfono del padrino actualizado exitosamente');
    } catch (error) {
      console.error('[PHONE-GODPARENT] update error:', error);
      return res.error('Error al actualizar el teléfono del padrino');
    }
  },

  /**
   * DELETE /api/godparents/:id/phone
   * Delete phone from godparent
   */
  delete: async (req, res) => {
    const { id } = req.params;
    try {
      const idNum = ValidationRules.parseIdParam(String(id || ''));
      if (!idNum) return res.validationErrors(['El parámetro id debe ser numérico']);
  const godparent = await GodParentService.findById(Number(idNum));
      if (!godparent) return res.notFound('Padrino');
      await PhoneGodparentService.deleteAllByGodparent(Number(idNum));
      const userEmailDelete = req.user?.sub;
      if (userEmailDelete) {
        await SecurityLogService.log({
          email: userEmailDelete,
          action: 'DELETE',
          description: `Se eliminó el teléfono del padrino "${godparent.name}" (ID: ${idNum}).`,
          affectedTable: 'PhoneGodparent'
        });
      }
      return res.success(null, 'Teléfono del padrino eliminado exitosamente');
    } catch (error) {
      console.error('[PHONE-GODPARENT] delete error:', error);
      return res.error('Error al eliminar el teléfono del padrino');
    }
  }
};

module.exports = { PhoneGodparentController };
