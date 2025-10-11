const prisma = require('../../../lib/prisma.js');

const CancerRepository = {
  list: () => prisma.cancer.findMany(),

  findById: (idCancer) =>
    prisma.cancer.findUnique({
      where: { idCancer: parseInt(idCancer) },
    }),

  create: (data) =>
    prisma.cancer.create({
      data,
    }),

  update: (idCancer, data) =>
    prisma.cancer.update({
      where: { idCancer: parseInt(idCancer) },
      data,
    }),

  remove: (idCancer) => prisma.cancer.update({
    where: { idCancer: parseInt(idCancer) },
    data: { status: 'inactive' },
  }),

  reactivate: (idCancer) => prisma.cancer.update({
    where: { idCancer: parseInt(idCancer) },
    data: { status: 'active' },
  }),
  
};

module.exports = { CancerRepository };
