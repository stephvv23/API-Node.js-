// Controller: Assets
// Adds input validation and consistent error responses.
// Length limits and required fields come from Prisma schema.

const { AssetsService } = require('./assetes.service');

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
    if (v != null && typeof v !== 'string') {
      errors.push({ field: 'description', code: 'type', message: 'must be a string' });
    } else if ((v ?? '').length > MAX.description) {
      errors.push({ field: 'description', code: 'maxLength', max: MAX.description });
    } else {
      data.description = v ?? '';
    }
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
      res.status(201).json(asset);
    } catch (err) { next(err); }
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

      const asset = await AssetsService.update(id, data);
      res.json(asset);
    } catch (err) { next(err); }
  },

  /** DELETE /assets/:idAsset */
  delete: async (req, res, next) => {
    try {
      const id = parseIdParam(req.params?.idAsset);
      if (!id) return res.status(400).json({ message: 'idAsset must be a positive integer' });

      await AssetsService.delete(id);
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
