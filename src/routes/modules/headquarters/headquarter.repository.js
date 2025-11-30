
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
  // Lists all headquarters (active and inactive)
  list: () => {
    return prisma.headquarter.findMany({
      select: baseSelect,
      orderBy: {
        name: 'asc'
      },
    });
  },
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
