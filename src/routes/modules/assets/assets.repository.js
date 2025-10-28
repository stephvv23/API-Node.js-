// modules/assets/assets.repository.js
const prisma = require('../../../lib/prisma.js'); 

const baseSelect = {
  idAsset: true,
  name: true,
  type: true,
  description: true,
  status: true,
  idCategory: true,
  idHeadquarter: true,
};

const AssetsRepository = {
  // Robust diagnostics
  list: async () => {
    try {
      // Checks connection
      await prisma.$queryRaw`SELECT 1`;
      // Fetches data
      return await prisma.asset.findMany({
        select: {
          ...baseSelect,
          category: { select: { idCategory: true, name: true, status: true } },
          headquarter: { select: { idHeadquarter: true, name: true, status: true } },
        },
      });
    } catch (e) {
      // Propagates with context
      throw new Error(`[AssetsRepository.list] ${e.message}`);
    }
  },

  findById: (idAsset) => {
    if (!idAsset) throw new Error('idAsset is required');
    return prisma.asset.findUnique({
      where: { idAsset: Number(idAsset) },
      select: baseSelect,
    });
  },

  create: (data) => {
    const { idCategory, idHeadquarter, ...rest } = data;
    return prisma.asset.create({
      data: {
        ...rest,
        category: { connect: { idCategory } },
        headquarter: { connect: { idHeadquarter } },
      },
      select: baseSelect,
    });
  },

  update: (idAsset, data) =>
    prisma.asset.update({
      where: { idAsset: Number(idAsset) },
      data,
      select: baseSelect,
    }),

  // Soft delete: sets status to 'inactive' instead of physically deleting
  remove: (idAsset) =>
    prisma.asset.update({
      where: { idAsset: Number(idAsset) },
      data: { status: 'inactive' },
      select: baseSelect,
    }),

  listByUserEmail: async (email) => {
  // search headquarters by email
  const headquarters = await prisma.headquarterUser.findMany({
    where: { email },
    select: { idHeadquarter: true },
  });
  const ids = headquarters.map((h) => h.idHeadquarter);

  // search including category and headquarter
  return prisma.asset.findMany({
    where: { idHeadquarter: { in: ids } },
    select: {
      ...baseSelect,
      category: { select: { idCategory: true, name: true, status: true } },
      headquarter: { select: { idHeadquarter: true, name: true, status: true } },
    },
  });
},

  // Check if category exists and is active
  categoryExists: async (idCategory) => {
    const category = await prisma.category.findUnique({
      where: { idCategory: Number(idCategory) },
      select: { idCategory: true, status: true }
    });
    
    if (!category) {
      return { exists: false, active: false };
    }
    
    return { 
      exists: true, 
      active: category.status === 'active' 
    };
  },

  // Check if headquarter exists and is active
  headquarterExists: async (idHeadquarter) => {
    const headquarter = await prisma.headquarter.findUnique({
      where: { idHeadquarter: Number(idHeadquarter) },
      select: { idHeadquarter: true, status: true }
    });
    
    if (!headquarter) {
      return { exists: false, active: false };
    }
    
    return { 
      exists: true, 
      active: headquarter.status === 'active' 
    };
  },

};

module.exports = { AssetsRepository };
