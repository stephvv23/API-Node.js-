// src/modules/phones/phones.service.js
const { PhonesRepository } = require('./phones.repository');
const ApiError = require('../../../utils/apiError');
const repo = PhonesRepository;            // <-- agrega esta línea

// helpers to clean and validate phone numbers
// Remove non-digit chars, trim, etc.
const sanitizePhone = (v) => String(v || '').trim().replace(/\D/g, '');
const isValidPhone = (v) => /^\+?\d{8,15}$/.test(v); // simple: 8–15 dígitos, opcional "+"

const MAX_PAGE_SIZE = 20;


const PhonesServices = {
  // list of all phones paginated
  list: async ({ page = 1, pageSize = 20, search } = {}) => {
    const p = Math.max(parseInt(page) || 1, 1);
    const size = Math.min(Math.max(parseInt(pageSize) || 20, 1), MAX_PAGE_SIZE);
    const skip = (p - 1) * size;

    const { items, total } = await repo.listPaginated({ skip, take: size, search });
    const totalPages = Math.max(Math.ceil(total / size), 1);

    return {
      meta: { page: p, pageSize: size, total, totalPages, hasNext: p < totalPages, hasPrev: p > 1, search: search || null },
      data: items,
    };
  },
  
  // get by id (PK)
  get: async (idPhone) => {
    const item = await PhonesRepository.findById(idPhone);
    if (!item) throw ApiError.notFound('Teléfono no encontrado');
    return item;
  },

  // create a new phone
  create: async (data) => {
    if (!data?.phone) throw ApiError.badRequest('phone es requerido');

    const cleaned = sanitizePhone(data.phone);
    if (!isValidPhone(cleaned)) throw ApiError.badRequest('Formato de teléfono inválido');

    const exists = await PhonesRepository.findByPhone(cleaned);
    if (exists) throw ApiError.conflict('El teléfono ya existe');

    return PhonesRepository.create({ phone: cleaned });
  },

  // update un teléfono por id (PK)
  update: async (idPhone, data) => {
    await PhonesServices.get(idPhone); // asegura 404 si no existe

    const patch = {};

    if (data?.phone !== undefined) {
      const cleaned = sanitizePhone(data.phone);
      if (!isValidPhone(cleaned)) throw ApiError.badRequest('Formato de teléfono inválido');

      const dupe = await PhonesRepository.findByPhone(cleaned);
      if (dupe && dupe.idPhone !== Number(idPhone)) {
        throw ApiError.conflict('El teléfono ya existe');
      }
      patch.phone = cleaned;
    }

    if (Object.keys(patch).length === 0) return PhonesRepository.findById(idPhone);
    return PhonesRepository.update(idPhone, patch);
  },


};

module.exports = { PhonesServices };

