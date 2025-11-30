const prisma = require('../../../lib/prisma.js');

const CancerRepository = {
  list: (filters = {}) => {
    const where = {};
    
    // Status filter - only apply if explicitly specified
    if (filters.status && filters.status !== 'all') {
      where.status = filters.status;
    }
    
    return prisma.cancer.findMany({ 
      where,
      orderBy: { idCancer: 'asc' }
    });
  },

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
