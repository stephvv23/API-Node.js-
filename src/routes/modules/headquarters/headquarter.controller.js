const { HeadquarterService } = require('./headquarter.service');

const HeadquarterController = {
  getAllActive: async (_req, res) => {
    try {
      const headquarters = await HeadquarterService.listActive();
      res.json({ ok: true, data: headquarters });
    } catch (error) {
      console.error('[HEADQUARTERS] getAllActive error:', error);
      res.status(500).json({ ok: false, message: 'Error al obtener las sedes activas' });
    }
  }
};

module.exports = { HeadquarterController };
