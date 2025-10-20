// Controller: Assets
// Adds input validation and consistent error responses.
// Length limits and required fields come from Prisma schema.

const { AssetsService } = require('./assets.service');
const { EntityValidators } = require('../../../utils/validator');

// ---- validation helpers ----
const MAX = {
  name: 50,
  type: 50,
  description: 750,
  status: 25,
};
const ALLOWED_STATUS = new Set(['active', 'inactive']);

function parseIdParam(id) {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function badRequest(res, errors, message = 'Invalid payload') {
  return res.status(400).json({ message, errors });
}

/**
 * Validate asset body.
 * @param {object} body - Request body
 * @param {object} options
 * @param {boolean} options.partial - When true, only validate provided fields (PUT partial update)
 * @returns {{ok:boolean, errors:Array, data:Object}}
 */


// ---- controller ----
const AssetsController = {
  /** GET /assets */
  list: async (req, res) => {
    try {
      const assets = await AssetsService.list(req?.query);
      return res.success(assets);
    } catch (error) {
      
      return res.error('Error al obtener los activos');
    }
  },

  /** GET /assets/:idAsset */
  get: async (req, res) => {
    try {
      const id = parseIdParam(req.params?.idAsset);
      if (!id) return res.validationErrors(['idAsset debe ser un entero positivo']);

      const asset = await AssetsService.get(id);
      if (!asset) return res.notFound('Activo');
      return res.success(asset);
    } catch (error) {
      
      return res.error('Error al obtener el activo');
    }
  },

  /** POST /assets */
  create: async (req, res) => {
    try {
      const validation = EntityValidators.asset(req.body, { partial: false });
      if (!validation.isValid) {
        return res.validationErrors(validation.errors);
      }
      const asset = await AssetsService.create(req.body);
      return res.status(201).success(asset, 'Activo creado exitosamente');
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.validationErrors([error.message]);
      }
      
      return res.error('Error al crear el activo');
    }
  },

  /** PUT /assets/:idAsset */
  update: async (req, res) => {
    try {
      const id = parseIdParam(req.params?.idAsset);
      if (!id) return res.validationErrors(['idAsset debe ser un entero positivo']);
      const exists = await AssetsService.get(id);
      if (!exists) return res.notFound('Activo');
      const validation = EntityValidators.asset(req.body, { partial: true });
      if (!validation.isValid) {
        return res.validationErrors(validation.errors);
      }
      if (!Object.keys(req.body).length) {
        return res.validationErrors(['No hay campos para actualizar']);
      }
      const asset = await AssetsService.update(id, req.body);
      return res.success(asset, 'Activo actualizado exitosamente');
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.validationErrors([error.message]);
      }
      return res.error('Error al actualizar el activo');
    }
  },

  /** DELETE /assets/:idAsset */
  delete: async (req, res) => {
    try {
      const id = parseIdParam(req.params?.idAsset);
      if (!id) return res.validationErrors(['idAsset debe ser un entero positivo']);
      // Confirmar existencia antes de eliminar
      const exists = await AssetsService.get(id);
      if (!exists) return res.notFound('Activo');
      const deleted = await AssetsService.delete(id);
      return res.success(deleted, 'Activo eliminado exitosamente');
    } catch (error) {
      return res.error('Error al eliminar el activo');
    }
  },

  /** GET /assets/user/:email */
  listByUserEmail: async (req, res) => {
    try {
      const email = String(req.params?.email || '').trim();
      if (!email) return res.validationErrors(['El email es requerido']);
      const simpleEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!simpleEmail.test(email)) return res.validationErrors(['Email inválido']);
      const assets = await AssetsService.listByUserEmail(email);
      return res.success(assets);
    } catch (error) {
      return res.error('Error al obtener los activos del usuario');
    }
  },
};

module.exports = { AssetsController };
