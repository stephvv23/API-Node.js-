const { HeadquarterService } = require('./headquarter.service');

const HeadquarterController = {
  // Lists all active headquarters
  getAllActive: async (_req, res) => {
    try {
      const headquarters = await HeadquarterService.listActive();
      res.json({ ok: true, data: headquarters });
    } catch (error) {
      console.error('[HEADQUARTERS] getAllActive error:', error);
      res.status(500).json({ ok: false, message: 'Error al obtener las sedes activas' });
    }
  },

  // Lists all headquarters
  getAll: async (_req, res) => {
    try {
      const headquarters = await HeadquarterService.list();
      res.json({ ok: true, data: headquarters });
    } catch (error) {
      console.error('[HEADQUARTERS] getAll error:', error);
      res.status(500).json({ ok: false, message: 'Error al obtener las sedes' });
    }
  },

  // Finds a headquarter by id
  getById: async (req, res) => {
    const { id } = req.params;
    try {
      const headquarter = await HeadquarterService.findById(id);
      if (!headquarter) {
        return res.status(404).json({ ok: false, message: 'Sede no encontrada' });
      }
      res.json({ ok: true, data: headquarter });
    } catch (error) {
      console.error('[HEADQUARTERS] getById error:', error);
      res.status(500).json({ ok: false, message: 'Error al obtener la sede' });
    }
  },

  // Creates a new headquarter
  create: async (req, res) => {
    const { name, schedule, location, email, description, status } = req.body;
    try {
      const newHeadquarter = await HeadquarterService.create({ name, schedule, location, email, description, status });
      res.status(201).json({ ok: true, data: newHeadquarter });
    } catch (error) {
      console.error('[HEADQUARTERS] create error:', error);
      res.status(500).json({ ok: false, message: 'Error al crear la sede' });
    }
  },

  // Updates an existing headquarter
  update: async (req, res) => {
    const { id } = req.params;
    const { name, schedule, location, email, description, status } = req.body;
    const errors = [];

    if (!name) errors.push('El campo "nombre" es obligatorio.');
    else if (!/^[a-zA-Z0-9\s]+$/.test(name)) errors.push('El campo "nombre" contiene caracteres inválidos.');

    if (!schedule) errors.push('El campo "horario" es obligatorio.');

    if (!location) errors.push('El campo "ubicación" es obligatorio.');

    if (!email) errors.push('El campo "email" es obligatorio.');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('El campo "email" no es válido.');

    if (!description) errors.push('El campo "descripción" es obligatorio.');

    if (!status) errors.push('El campo "estado" es obligatorio.');
    else if (!['active', 'inactive'].includes(status)) errors.push('El campo "estado" debe ser "active" o "inactive".');

    if (errors.length > 0) {
      return res.status(400).json({ ok: false, errores: errors });
    }

    try {
      const updatedHeadquarter = await HeadquarterService.update(id, { name, schedule, location, email, description, status });
      if (!updatedHeadquarter) {
        return res.status(404).json({ ok: false, message: `No se encontró la sede con el ID ${id}` });
      }
      res.json({ ok: true, data: updatedHeadquarter });
    } catch (error) {
      console.error('[HEADQUARTERS] update error:', error);
      const message = error.message || 'Error al actualizar la sede';
      res.status(500).json({ ok: false, message: `No se pudo actualizar la sede: ${message}` });
    }
  },

  // Removes a headquarter
  delete: async (req, res) => {
    const { id } = req.params;
    try {
      const deletedHeadquarter = await HeadquarterService.remove(id);
      if (!deletedHeadquarter) {
        return res.status(404).json({ ok: false, message: 'Sede no encontrada' });
      }
      res.json({ ok: true, data: deletedHeadquarter });
    } catch (error) {
      console.error('[HEADQUARTERS] remove error:', error);
      res.status(500).json({ ok: false, message: 'Error al eliminar la sede' });
    }
  }
};

module.exports = { HeadquarterController };
