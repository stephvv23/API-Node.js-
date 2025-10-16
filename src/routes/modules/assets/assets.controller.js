// Controller: Assets
// Adds input validation and consistent error responses.
// Length limits and required fields come from Prisma schema.

const { AssetsService } = require('./assets.service');
const { SecurityLogService } = require('../../../services/securitylog.service');

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
function validateAssetBody(body = {}, { partial = false } = {}) {
  const errors = [];
  const data = {};
  const has = (k) => Object.prototype.hasOwnProperty.call(body, k);
  
  // Define allowed fields for asset creation/update
  const allowedFields = ['idCategory', 'idHeadquarter', 'name', 'type', 'description', 'status'];
  
  // Check for unexpected fields and warn (but don't reject)
  const bodyKeys = Object.keys(body);
  const unexpectedFields = bodyKeys.filter(key => !allowedFields.includes(key));
  if (unexpectedFields.length > 0) {
    // Log unexpected fields but continue processing
    console.warn('Unexpected fields in request body:', unexpectedFields);
  }

  // idCategory (required on create)
  if (!partial || has('idCategory')) {
    const v = body.idCategory;
    if (v === undefined || v === null || v === '') {
      if (!partial) errors.push({ field: 'idCategory', code: 'required' });
    } else if (!Number.isInteger(Number(v)) || Number(v) <= 0) {
      errors.push({ field: 'idCategory', code: 'type', message: 'must be a positive integer' });
    } else {
      data.idCategory = Number(v);
    }
  }

  // idHeadquarter (required on create)
  if (!partial || has('idHeadquarter')) {
    const v = body.idHeadquarter;
    if (v === undefined || v === null || v === '') {
      if (!partial) errors.push({ field: 'idHeadquarter', code: 'required' });
    } else if (!Number.isInteger(Number(v)) || Number(v) <= 0) {
      errors.push({ field: 'idHeadquarter', code: 'type', message: 'must be a positive integer' });
    } else {
      data.idHeadquarter = Number(v);
    }
  }

  // name (required on create, string, 1..50)
  if (!partial || has('name')) {
    const v = body.name;
    if (typeof v !== 'string' || !v.trim()) {
      if (!partial) errors.push({ field: 'name', code: 'required' });
    } else if (v.trim().length > MAX.name) {
      errors.push({ field: 'name', code: 'maxLength', max: MAX.name });
    } else {
      data.name = v.trim();
    }
  }

  // type (required on create, string, 1..50)
  if (!partial || has('type')) {
    const v = body.type;
    if (typeof v !== 'string' || !v.trim()) {
      if (!partial) errors.push({ field: 'type', code: 'required' });
    } else if (v.trim().length > MAX.type) {
      errors.push({ field: 'type', code: 'maxLength', max: MAX.type });
    } else {
      data.type = v.trim();
    }
  }

  // description (optional, string, 0..750)
  if (has('description')) {
    const v = body.description;
    // If provided, description must be a string and not an empty string
    if (v != null && typeof v !== 'string') {
      errors.push({ field: 'description', code: 'type', message: 'must be a string' });
    } else if (v == null) {
      // treat null/undefined as empty string for storage
      data.description = '';
    } else if (v.trim().length === 0) {
      // reject explicitly empty descriptions when provided
      errors.push({ field: 'description', code: 'empty', message: 'description must not be empty' });
    } else if (v.length > MAX.description) {
      errors.push({ field: 'description', code: 'maxLength', max: MAX.description });
    } else {
      data.description = v;
    }
  } else if (!partial) {
    // For create operations, set default empty description if not provided
    data.description = '';
  }

  // status (required on create, 'active' | 'inactive', max 25)
  if (!partial || has('status')) {
    const raw = body.status;
    if (typeof raw !== 'string' || !raw.trim()) {
      if (!partial) errors.push({ field: 'status', code: 'required' });
    } else {
      const v = raw.trim().toLowerCase();
      if (!ALLOWED_STATUS.has(v)) {
        errors.push({ field: 'status', code: 'enum', allowed: Array.from(ALLOWED_STATUS) });
      } else if (v.length > MAX.status) {
        errors.push({ field: 'status', code: 'maxLength', max: MAX.status });
      } else {
        data.status = v;
      }
    }
  }

  return { ok: errors.length === 0, errors, data };
}

// ---- controller ----
const AssetsController = {
  /** GET /assets */
  list: async (req, res, next) => {
    try {
      // (Optional) accept pagination/filter query here if your service supports it
      const assets = await AssetsService.list(req?.query);
      res.json(assets);
    } catch (err) { next(err); }
  },

  /** GET /assets/:idAsset */
  get: async (req, res, next) => {
    try {
      const id = parseIdParam(req.params?.idAsset);
      if (!id) return res.status(400).json({ message: 'idAsset must be a positive integer' });

      const asset = await AssetsService.get(id);
      if (!asset) return res.status(404).json({ message: 'Asset no encontrado' });
      res.json(asset);
    } catch (err) { next(err); }
  },

  /** POST /assets */
  create: async (req, res, next) => {
    try {
      const { ok, errors, data } = validateAssetBody(req.body, { partial: false });
      if (!ok) return badRequest(res, errors);

      const asset = await AssetsService.create(data);
      
      // Register security log for asset creation
      const userEmail = req.user?.sub;
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
      
      res.status(201).json(asset);
    } catch (err) { 
      // Handle validation errors from service
      if (err.name === 'ValidationError') {
        return res.status(err.statusCode || 400).json({ message: err.message });
      }
      next(err); 
    }
  },

  /** PUT /assets/:idAsset */
  update: async (req, res, next) => {
    try {
      const id = parseIdParam(req.params?.idAsset);
      if (!id) return res.status(400).json({ message: 'idAsset must be a positive integer' });

      const { ok, errors, data } = validateAssetBody(req.body, { partial: true });
      if (!ok) return badRequest(res, errors);
      if (!Object.keys(data).length) {
        return badRequest(res, [{ code: 'empty', message: 'No fields to update' }]);
      }

      // Get previous asset data for logging
      const previousAsset = await AssetsService.get(id);
      if (!previousAsset) {
        return res.status(404).json({ message: 'Asset no encontrado' });
      }

      const asset = await AssetsService.update(id, data);
      
      // Register security log for asset update
      const userEmail = req.user?.sub;

      // Verify if only the status changed from inactive to active
      const onlyStatusChange =
        previousAsset.status === 'inactive' &&
        asset.status === 'active' &&
        previousAsset.idCategory === asset.idCategory &&
        previousAsset.idHeadquarter === asset.idHeadquarter &&
        previousAsset.name === asset.name &&
        previousAsset.type === asset.type &&
        previousAsset.description === asset.description;

      if (onlyStatusChange) {
        await SecurityLogService.log({
          email: userEmail,
          action: 'REACTIVATE',
          description:
            `Se reactivó el activo con ID "${id}". Datos completos:\n` +
            `Categoría ID: "${asset.idCategory}", ` +
            `Sede ID: "${asset.idHeadquarter}", ` +
            `Nombre: "${asset.name}", ` +
            `Tipo: "${asset.type}", ` +
            `Descripción: "${asset.description}", ` +
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
            `Categoría ID: "${previousAsset.idCategory}", ` +
            `Sede ID: "${previousAsset.idHeadquarter}", ` +
            `Nombre: "${previousAsset.name}", ` +
            `Tipo: "${previousAsset.type}", ` +
            `Descripción: "${previousAsset.description}", ` +
            `Estado: "${previousAsset.status}". \n` +
            `Nueva versión: ` +
            `Categoría ID: "${asset.idCategory}", ` +
            `Sede ID: "${asset.idHeadquarter}", ` +
            `Nombre: "${asset.name}", ` +
            `Tipo: "${asset.type}", ` +
            `Descripción: "${asset.description}", ` +
            `Estado: "${asset.status}". \n`,
          affectedTable: 'Assets',
        });
      }

      res.json(asset);
    } catch (err) { 
      // Handle validation errors from service
      if (err.name === 'ValidationError') {
        return res.status(err.statusCode || 400).json({ message: err.message });
      }
      next(err); 
    }
  },

  /** DELETE /assets/:idAsset */
  delete: async (req, res, next) => {
    try {
      const id = parseIdParam(req.params?.idAsset);
      if (!id) return res.status(400).json({ message: 'idAsset must be a positive integer' });

      // Get asset data before deletion for logging
      const deletedAsset = await AssetsService.get(id);
      if (!deletedAsset) {
        return res.status(404).json({ message: 'Asset no encontrado' });
      }

      await AssetsService.delete(id);
      
      // Register security log for asset deletion/inactivation
      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'INACTIVE',
        description: 
          `Se inactivó el activo: ` +
          `ID "${id}", ` +
          `Categoría ID: "${deletedAsset.idCategory}", ` +
          `Sede ID: "${deletedAsset.idHeadquarter}", ` +
          `Nombre: "${deletedAsset.name}", ` +
          `Tipo: "${deletedAsset.type}", ` +
          `Descripción: "${deletedAsset.description}", ` +
          `Estado: "${deletedAsset.status}".`,
        affectedTable: 'Assets',
      });
      
      res.status(204).end();
    } catch (err) { next(err); }
  },

  /** GET /assets/user/:email */
  listByUserEmail: async (req, res, next) => {
    try {
      const email = String(req.params?.email || '').trim();
      if (!email) return res.status(400).json({ message: 'Email is required' });
      // very light email format check
      const simpleEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!simpleEmail.test(email)) return res.status(400).json({ message: 'Invalid email' });

      const assets = await AssetsService.listByUserEmail(email);
      res.json(assets);
    } catch (err) { next(err); }
  },
};

module.exports = { AssetsController };
