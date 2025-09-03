// src/modules/phones/phones.service.js
const { PhonesRepository } = require("./phones.repository");
const ApiError = require("../../../utils/apiError");

const repo = PhonesRepository; // alias

// --- Helpers ---
const onlyDigits = (v) => String(v ?? "").replace(/\D/g, ""); // removes everything except digits
const isDigitsLengthBetween = (s, min, max) =>
  /^\d+$/.test(s) && s.length >= min && s.length <= max;
const toInt = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

const validatePhoneInput = (raw) => {
  const digits = onlyDigits(raw);

  if (!/^\d+$/.test(digits)) {
    throw ApiError.badRequest('El teléfono debe contener solo dígitos');
  }

  if (digits.length < MIN_PHONE_LEN || digits.length > MAX_PHONE_LEN) {
    throw ApiError.badRequest(`El teléfono debe tener entre ${MIN_PHONE_LEN} y ${MAX_PHONE_LEN} dígitos`);
  }

  const number = Number(digits);

  // denied truncated numbers and numbers > 2147483647 (max Int in many DBs)
  if (!Number.isSafeInteger(number) || number > 2147483647) {
    throw ApiError.badRequest('El número excede el rango permitido');
  }

  return number;
};


const MAX_PAGE_SIZE = 20;
const MIN_PHONE_LEN = 8;
const MAX_PHONE_LEN = 15;

// ⚠️ Note: Using Int in DB removes leading zeros.
// If you need to keep them, change the schema to String.

// ---------------- Services ----------------
const PhonesServices = {
  // Paginated list
  list: async ({ page = 1, pageSize = 20, search } = {}) => {
    const p = Math.max(parseInt(page) || 1, 1);
    const size = Math.min(Math.max(parseInt(pageSize) || 20, 1), MAX_PAGE_SIZE);
    const skip = (p - 1) * size;

    // if search is provided, only pass it if it's numeric
    let searchNumeric = undefined;
    if (
      search !== undefined &&
      search !== null &&
      String(search).trim() !== ""
    ) {
      const digits = onlyDigits(search);
      const n = toInt(digits);
      if (n !== null) searchNumeric = n;
    }

    const { items, total } = await repo.listPaginated({
      skip,
      take: size,
      search: searchNumeric,
    });
    const totalPages = Math.max(Math.ceil(total / size), 1);

    return {
      meta: {
        page: p,
        pageSize: size,
        total,
        totalPages,
        hasNext: p < totalPages,
        hasPrev: p > 1,
        search: search ?? null,
      },
      data: items,
    };
  },

  // Get by PK
  get: async (idPhone) => {
    const item = await repo.findById(idPhone);
    if (!item) throw ApiError.notFound("Teléfono no encontrado");
    return item;
  },

  // Create
  create: async (data) => {
    if (!data?.phone) throw ApiError.badRequest("phone es requerido");

    const n = validatePhoneInput(data.phone);

    // Avoid duplicates
    const exists = await repo.findByPhone(n);
    if (exists) throw ApiError.conflict("El teléfono ya existe");

    return repo.create({ phone: n });
  },

  // Update by PK
  update: async (idPhone, data) => {
    await PhonesServices.get(idPhone); // throws 404 if not found

    const patch = {};

    if (data?.phone !== undefined) {
    const n = validatePhoneInput(data.phone);

      const dupe = await repo.findByPhone(n);
      if (dupe && dupe.idPhone !== Number(idPhone)) {
        throw ApiError.conflict('El teléfono ya existe');
      }

      patch.phone = n;
    }


    if (Object.keys(patch).length === 0) return repo.findById(idPhone);
    return repo.update(idPhone, patch);
  },

  // (optional) Delete by PK
  delete: async (idPhone) => {
    await PhonesServices.get(idPhone); // ensures 404 if not found
    await repo.delete(idPhone);
    return { ok: true };
  },
};

module.exports = { PhonesServices };
