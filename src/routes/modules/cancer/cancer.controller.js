const { CancerService } = require('./cancer.service');

const CancerController = {
  list: async (_req, res) => {
    const cancers = await CancerService.list();
    res.json(cancers);
  },

  get: async (req, res) => {
    const { idCancer } = req.params;
    const cancer = await CancerService.get(idCancer);
    if (!cancer) return res.status(404).json({ message: 'Cáncer no encontrado' });
    res.json(cancer);
  },

  create: async (req, res) => {
    const { cancerName, description, status } = req.body || {};
    if (!cancerName || !description) {
      return res
        .status(400)
        .json({ message: 'cancerName y description son obligatorios' });
    }
    try {
      const created = await CancerService.create({ cancerName, description, status });
      res.status(201).json(created);
    } catch (e) {
      console.error('[CANCER] create error:', e);
      res.status(500).json({ message: 'Error al crear cáncer' });
    }
  },

  update: async (req, res) => {
    const { idCancer } = req.params;
    const { cancerName, description, status } = req.body || {};
    try {
      const updated = await CancerService.update(idCancer, { cancerName, description, status });
      res.json(updated);
    } catch (e) {
      if (e && e.code === 'P2025')
        return res.status(404).json({ message: 'Cáncer no encontrado' });
      throw e;
    }
  },

  remove: async (req, res) => {
  const { idCancer } = req.params;
  try {
    const updated = await CancerService.delete(idCancer);
    res.json({ message: 'Cáncer marcado como inactivo (soft delete)', data: updated });
  } catch (e) {
    if (e && e.code === 'P2025') {
      return res.status(404).json({ message: 'Cáncer no encontrado' });
    }
    throw e;
  }
},



};

module.exports = { CancerController };
