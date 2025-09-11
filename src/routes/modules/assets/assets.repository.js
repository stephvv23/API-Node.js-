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
  // ✅ Robust diagnostics
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

  create: (data) =>
    prisma.asset.create({
      data,
      select: baseSelect,
    }),

  update: (idAsset, data) =>
    prisma.asset.update({
      where: { idAsset: Number(idAsset) },
      data,
      select: baseSelect,
    }),

  remove: (idAsset) =>
    prisma.asset.delete({
      where: { idAsset: Number(idAsset) },
      select: baseSelect,
    }),

  listByUserEmail: async (email) => {
  // search headquarters by email
  const headquarters = await prisma.headquarterUser.findMany({
    where: { email },
    select: { idHeadquarter: true },
  });
  const ids = headquarters.map((h) => h.idHeadquarter);

  // search including category y headquarter
  return prisma.asset.findMany({
    where: { idHeadquarter: { in: ids } },
    select: {
      ...baseSelect,
      category: { select: { idCategory: true, name: true, status: true } },
      headquarter: { select: { idHeadquarter: true, name: true, status: true } },
    },
  });
},

};

module.exports = { AssetsRepository };
