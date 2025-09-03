// src/modules/phones/phones.controller.js
const { PhonesServices } = require('./phones.service');
const ApiError = require('../../../utils/apiError');

/**
 * Endpoints:
 * - GET    /phones?page=&pageSize=&search=
 * - GET    /phones/:idPhone
 * - POST   /phones
 * - PUT    /phones/:idPhone
 * - DELETE /phones/:idPhone
 */
const PhonesController = {
  // GET /phones?page=&pageSize=&search=
  list: async (req, res, next) => {
    try {
      const { page, pageSize, search } = req.query;
      const result = await PhonesServices.list({ page, pageSize, search });
      res.json(result);
    } catch (e) {
      next(e);
    }
  },

  // GET /phones/:idPhone
  get: async (req, res, next) => {
    try {
      const { idPhone } = req.params;
      const item = await PhonesServices.get(idPhone);
      
      res.json(item);
    } catch (e) {
      if (e && e.code === 'P2025') {
        return res.status(404).json({ message: 'Teléfono no encontrado' });
      }
      next(e);
    }
  },

  // POST /phones { phone }
  create: async (req, res, next) => {
    try {
      const { phone } = req.body || {};
      if (!phone) return next(ApiError.badRequest('phone es requerido'));

      const created = await PhonesServices.create({ phone });
      res.status(201).json(created);
    } catch (e) {
      if (e && e.code === 'P2002') {
        // unique constraint (si luego pones @unique en schema)
        return res.status(409).json({ message: 'El teléfono ya existe' });
      }
      next(e);
    }
  },

  // PUT /phones/:idPhone { phone }
  update: async (req, res, next) => {
    try {
      const { idPhone } = req.params;
      const { phone } = req.body || {};

      const updated = await PhonesServices.update(idPhone, { phone });
      res.json(updated);
    } catch (e) {
      if (e && e.code === 'P2025') {
        return res.status(404).json({ message: 'Teléfono no encontrado' });
      }
      if (e && e.code === 'P2002') {
        return res.status(409).json({ message: 'El teléfono ya existe' });
      }
      next(e);
    }
  },

  // DELETE /phones/:idPhone
  remove: async (req, res, next) => {
    try {
      const { idPhone } = req.params;
      await PhonesServices.delete(idPhone);
      res.status(204).send(); // No Content
    } catch (e) {
      if (e && e.code === 'P2025') {
        return res.status(404).json({ message: 'Teléfono no encontrado' });
      }
      next(e);
    }
  },
};

module.exports = { PhonesController };
