let prisma = require('../../../lib/prisma.js');

const baseSelect = {
  idSurvivor: true,
  idHeadquarter: true,
  survivorName: true,
  documentNumber: true,
  country: true,
  birthday: true,
  email: true,
  residence: true,
  genre: true,
  workingCondition: true,
  CONAPDIS: true,
  IMAS: true,
  physicalFileStatus: true,
  medicalRecord: true,
  dateHomeSINRUBE: true,
  foodBank: true,
  socioEconomicStudy: true,
  notes: true,
  status: true,
  headquarter: {
    select: {
      idHeadquarter: true,
      name: true,
      email: true,
      location: true
    }
  }
};

const SurvivorRepository = {
  // List survivors (by status or all)
    list: ({ status = 'active', take = 100, skip = 0 } = {}) => {
    const where = status === 'all' ? {} : { status };
    return prisma.survivor.findMany({
      where,
      select: baseSelect,
      orderBy: { survivorName: 'asc' },
      take,
      skip,
    });
  },

  // List only active survivors
  listActive: () =>
    prisma.survivor.findMany({
      where: { status: 'active' },
      select: baseSelect
    }),

  // Find by ID
  findById: (id) =>
    prisma.survivor.findUnique({
      where: { idSurvivor: Number(id) },
      select: baseSelect
    }),

  // Find by name
  findByName: (name) =>
    prisma.survivor.findFirst({
      where: { survivorName: { equals: name, mode: 'insensitive' } },
      select: baseSelect
    }),

  // Find by email
  findByEmail: (email) =>
    prisma.survivor.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: baseSelect
    }),

  // Create a new survivor
  create: (data) =>
    prisma.survivor.create({
      data,
      select: baseSelect
    }),

  // Update survivor data
  update: (id, data) =>
    prisma.survivor.update({
      where: { idSurvivor: Number(id) },
      data,
      select: baseSelect
    }),

  // Deactivate a survivor
  remove: (id) =>
    prisma.survivor.update({
      where: { idSurvivor: Number(id) },
      data: { status: 'inactive' },
      select: baseSelect
    }),

  // Reactivate a survivor
  reactivate: (id) =>
    prisma.survivor.update({
      where: { idSurvivor: Number(id) },
      data: { status: 'active' },
      select: baseSelect
    }),
};

module.exports = { SurvivorRepository };
