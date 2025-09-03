// NOTE: This imports Prisma client from lib/prisma.js (not from ../../prisma/client or .ts)
const prisma = require('../../../lib/prisma.js'); 

// Fields to select for phones queries (phone)
const baseSelect = {
  idPhone: true,
  phone: true
};

// PhonesRepository provides direct database operations for User entities.
const PhonesRepository = {

  //return all phones paginated
  listPaginated: async ({ skip = 0, take = 20, search } = {}) => {
    const where = search
      ? { phone: { contains: String(search), mode: 'insensitive' } }
      : {};

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
  
//Found by id
  findById: (idPhone) =>
    prisma.phone.findUnique({
      where: { idPhone: Number(idPhone) },
      select: baseSelect,
    }),

// find by phone
  findByPhone: (phone) =>
    prisma.phone.findUnique({
      where: { phone },
      select: baseSelect,
    }),

  //create
  create: (data) => prisma.phone.create({ data, select: baseSelect }),

  // update by id
  update: (idPhone, data) =>
    prisma.phone.update({
      where: { idPhone: Number(idPhone) },
      data,
      select: baseSelect,
    }),

 
  // phone examples
};

module.exports = { PhonesRepository };