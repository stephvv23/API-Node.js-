
let prisma = require('../../../lib/prisma.js');

const baseSelect = {
  idHeadquarter: true,
  name: true,
  schedule: true,
  location: true,
  email: true,
  description: true,
  status: true
};

const HeadquarterRepository = {
  // Lists all headquarters
  list: () =>
    prisma.headquarter.findMany({
      select: baseSelect
    }),
  // Lists all active headquarters
  listActive: () =>
    prisma.headquarter.findMany({
      where: { status: 'active' },
      select: baseSelect
    }),
  // Finds a headquarter by id
  findById: (id) =>
    prisma.headquarter.findUnique({
      where: { idHeadquarter: Number(id) },
      select: baseSelect
    }),
  // Creates a new headquarter
  create: (data) =>
    prisma.headquarter.create({
      data,
      select: baseSelect,
    }),
  // Updates an existing headquarter
  update: (id, data) =>
    prisma.headquarter.update({
      where: { idHeadquarter: Number(id) },
      data,
      select: baseSelect,
    }),
  // Soft delete: sets status to 'inactive'
  remove: (id) =>
    prisma.headquarter.update({
      where: { idHeadquarter: Number(id) },
      data: { status: 'inactive' },
    }),
};

module.exports = { HeadquarterRepository };
