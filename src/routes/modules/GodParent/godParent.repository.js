let prisma = require('../../../lib/prisma.js');

const baseSelect = {
  idGodparent: true,
  idSurvivor: true,
  idHeadquarter: true,
  name: true,
  email: true,
  paymentMethod: true,
  startDate: true,
  finishDate: true,
  description: true,
  status: true,
  survivor: {
    select: {
      idSurvivor: true,
      survivorName: true,
      email: true
    }
  },
  headquarter: {
    select: {
      idHeadquarter: true,
      name: true,
      email: true
    }
  }
};

const GodParentRepository = {
  // Lists all godparents (active and inactive)
  list: () => {
    return prisma.godparent.findMany({
      select: baseSelect,
      orderBy: {
        name: 'asc'
      },
    });
  },

  // Finds a godparent by id
  findById: (id) =>
    prisma.godparent.findUnique({
      where: { idGodparent: Number(id) },
      select: baseSelect
    }),

  findByName: (name) =>
    prisma.godparent.findFirst({
      where: { name: name },
      select: baseSelect
    }),

  findByEmail: (email) =>
    prisma.godparent.findFirst({
      where: { email: email },
      select: baseSelect
    }),

  // Creates a new godparent
  create: (data) =>
    prisma.godparent.create({
      data,
      select: baseSelect,
    }),

  // Updates an existing godparent
  update: (id, data) =>
    prisma.godparent.update({
      where: { idGodparent: Number(id) },
      data,
      select: baseSelect,
    }),

  // Soft delete: sets status to 'inactive'
  remove: (id) =>
    prisma.godparent.update({
      where: { idGodparent: Number(id) },
      data: { status: 'inactive' },
    }),
};

module.exports = { GodParentRepository };