const { PhoneService } = require('./phone.service');
const { ValidationRules } = require('../../../utils/validator');

const PhoneController = {
  /**
   * GET /api/phones
   * List all phones
   */
  list: async (req, res) => {
    try {
      const phones = await PhoneService.list();
      return res.success(phones, 'Teléfonos obtenidos exitosamente');
    } catch (error) {
      console.error('[PHONE] list error:', error);
      return res.error('Error al obtener los teléfonos');
    }
  },

  /**
   * GET /api/phones/:id
   * Get a specific phone by ID
   */
  getOne: async (req, res) => {
    const { id } = req.params;

    try {
      // Validate numeric id
      const idNum = ValidationRules.parseIdParam(String(id || ''));
      if (!idNum) return res.validationErrors(['El parámetro id debe ser numérico']);

      const phone = await PhoneService.findById(Number(idNum));
      
      if (!phone) {
        return res.notFound('Teléfono');
      }

      return res.success(phone, 'Teléfono obtenido exitosamente');
    } catch (error) {
      console.error('[PHONE] getOne error:', error);
      return res.error('Error al obtener el teléfono');
    }
  }
};

module.exports = { PhoneController };
