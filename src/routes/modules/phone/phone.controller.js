const { PhoneService } = require('./phone.service');

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
      const phone = await PhoneService.findById(id);
      
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
