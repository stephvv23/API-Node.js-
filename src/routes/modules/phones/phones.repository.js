// NOTE: This imports Prisma client from lib/prisma.js (not from ../../prisma/client or .ts)
const prisma = require('../../../lib/prisma.js');

// Common selection for Phone
const baseSelect = {
  idPhone: true,
  phone: true,
};

// Helper: cast to integer or return null
const toInt = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

// PhonesRepository provides direct database operations for Phone entities.
const PhonesRepository = {
  // return all phones paginated
  listPaginated: async ({ skip = 0, take = 20, search } = {}) => {
    let where = {};

    // Since phone is Int, we only filter if search is numeric.
    if (search !== undefined && search !== null && String(search).trim() !== '') {
      const n = toInt(search);
      if (n !== null) {
        where = { phone: n }; // equality on Int
      }
      // If search is not numeric, ignore filter (or podrías forzar 0 resultados)
    }

    const [items, total] = await Promise.all([
      prisma.phone.findMany({
        where,
        select: baseSelect,
        skip: Number(skip),
        take: Number(take),
        orderBy: { idPhone: 'desc' },
      }),
      prisma.phone.count({ where }),
    ]);

    return { items, total };
  },

  // find by id
  findById: (idPhone) =>
    prisma.phone.findUnique({
      where: { idPhone: Number(idPhone) },
      select: baseSelect,
    }),

  // find by phone (phone is NOT unique -> use findFirst)
  findByPhone: (phone) => {
    const n = toInt(phone);
    if (n === null) return null; // evita query inválida
    return prisma.phone.findFirst({
      where: { phone: n },
      select: baseSelect,
    });
  },

  // create
  create: (data) => {
    const n = toInt(data?.phone);
    if (n === null) {
      // Puedes dejar que el service valide y lanzar allí.
      // Aquí lanzo para evitar escribir basura.
      throw new Error('phone must be an integer');
    }
    return prisma.phone.create({
      data: { phone: n },
      select: baseSelect,
    });
  },

  // update by id
  update: (idPhone, data) => {
    const payload = { ...data };
    if (payload.phone !== undefined) {
      const n = toInt(payload.phone);
      if (n === null) throw new Error('phone must be an integer');
      payload.phone = n;
    }
    return prisma.phone.update({
      where: { idPhone: Number(idPhone) },
      data: payload,
      select: baseSelect,
    });
  },

  // delete by id (faltaba)
  delete: (idPhone) =>
    prisma.phone.delete({
      where: { idPhone: Number(idPhone) },
      select: baseSelect,
    }),
};

module.exports = { PhonesRepository };
