// Controller: Assets
// Adds input validation and consistent error responses.
// Length limits and required fields come from Prisma schema.

const { AssetsService } = require('./assets.service');
const { SecurityLogService } = require('../../../services/securitylog.service');
const { EntityValidators, ValidationRules } = require('../../../utils/validator');

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
      // Trim all string fields to prevent leading/trailing spaces and normalize multiple spaces
      const trimmedBody = ValidationRules.trimStringFields(req.body);
      
      const validation = EntityValidators.asset(trimmedBody, { partial: false });

      if (!validation.isValid) {
        return res.validationErrors(validation.errors);
      }
      const asset = await AssetsService.create(trimmedBody);

      const userEmail = req.user?.sub;
      if (!userEmail) {
        return res.status(401).json({ message: 'No se pudo identificar el usuario autenticado para registrar la acción de seguridad.' });
      }
      await SecurityLogService.log({
        email: userEmail,
        action: 'CREATE',
        description: 
          `Se creó el activo con los siguientes datos: ` +
          `ID: "${asset.idAsset}", ` +
          `Categoría ID: "${asset.idCategory}", ` +
          `Sede ID: "${asset.idHeadquarter}", ` +
          `Nombre: "${asset.name}", ` +
          `Tipo: "${asset.type}", ` +
          `Descripción: "${asset.description}", ` +
          `Estado: "${asset.status}".`,
        affectedTable: 'Assets',
      });

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
      
      // Trim all string fields to prevent leading/trailing spaces and normalize multiple spaces
      const updateData = ValidationRules.trimStringFields(req.body);
      
      const validation = EntityValidators.asset(updateData, { partial: true });
      if (!validation.isValid) {
        return res.validationErrors(validation.errors);
      }
      if (!Object.keys(updateData).length) {
        return res.validationErrors(['No hay campos para actualizar']);
      }

      const previousAsset = await AssetsService.get(id);
      if (!previousAsset) return res.notFound('Activo');

      const asset = await AssetsService.update(id, updateData);

      const userEmail = req.user?.sub;

      const onlyStatusChange =
        previousAsset.status === 'inactive' &&
        asset.status === 'active' &&
        previousAsset.name === asset.name &&
        previousAsset.type === asset.type &&
        previousAsset.description === asset.description &&
        previousAsset.idCategory === asset.idCategory &&
        previousAsset.idHeadquarter === asset.idHeadquarter;

      if (onlyStatusChange) {
        await SecurityLogService.log({
          email: userEmail,
          action: 'REACTIVATE',
          description:
            `Se reactivó el activo con ID "${id}". Datos completos:\n` +
            `Nombre: "${asset.name}", ` +
            `Tipo: "${asset.type}", ` +
            `Descripción: "${asset.description}", ` +
            `Categoría ID: "${asset.idCategory}", ` +
            `Sede ID: "${asset.idHeadquarter}", ` +
            `Estado: "${asset.status}".`,
          affectedTable: 'Assets',
        });
      } else {
        await SecurityLogService.log({
          email: userEmail,
          action: 'UPDATE',
          description:
            `Se actualizó el activo con ID "${id}".\n` +
            `Versión previa: ` +
            `Nombre: "${previousAsset.name}", ` +
            `Tipo: "${previousAsset.type}", ` +
            `Descripción: "${previousAsset.description}", ` +
            `Categoría ID: "${previousAsset.idCategory}", ` +
            `Sede ID: "${previousAsset.idHeadquarter}", ` +
            `Estado: "${previousAsset.status}". \n` +
            `Nueva versión: ` +
            `Nombre: "${asset.name}", ` +
            `Tipo: "${asset.type}", ` +
            `Descripción: "${asset.description}", ` +
            `Categoría ID: "${asset.idCategory}", ` +
            `Sede ID: "${asset.idHeadquarter}", ` +
            `Estado: "${asset.status}". \n`,
          affectedTable: 'Assets',
        });
      }

      return res.success(asset, 'Activo actualizado exitosamente');
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.validationErrors([error.message]);
      }
      return res.error('Error al actualizar el activo');
    }
  },

  delete: async (req, res) => {
    try {
      const id = parseIdParam(req.params?.idAsset);
      if (!id) return res.validationErrors(['idAsset debe ser un entero positivo']);
      
      const exists = await AssetsService.get(id);
      if (!exists) return res.notFound('Activo');
      
      const deleted = await AssetsService.delete(id);

      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'INACTIVE',
        description:
          `Se inactivó el activo: ` +
          `ID "${id}", ` +
          `Nombre: "${deleted.name}", ` +
          `Tipo: "${deleted.type}", ` +
          `Descripción: "${deleted.description}", ` +
          `Categoría ID: "${deleted.idCategory}", ` +
          `Sede ID: "${deleted.idHeadquarter}", ` +
          `Estado: "${deleted.status}".`,
        affectedTable: 'Assets',
      });

      return res.success(deleted, 'Activo inactivado exitosamente');
    } catch (error) {
      return res.error('Error al inactivar el activo');
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
