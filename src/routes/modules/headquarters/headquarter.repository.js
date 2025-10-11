
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
  // Lists headquarters with optional status, pagination, and ordering
    list: ({ status = 'active', take = 100, skip = 0 } = {}) => {
      const where = status === 'all' ? {} : { status };
      return prisma.headquarter.findMany({
        where,
        select: baseSelect,
        orderBy: {
          name: 'asc'
        },
        take,
        skip,
      });
    },
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
    findbyname: (name) =>
  prisma.headquarter.findUnique({
    where: { name: name },
    select: baseSelect
  }),
findbyemail: (email) =>
  prisma.headquarter.findFirst({ 
    where: { email: email },
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
