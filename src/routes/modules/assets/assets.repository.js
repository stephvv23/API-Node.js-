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
  // ✅ Diagnóstico robusto
  list: async () => {
    try {
      // Verifica conexión
      await prisma.$queryRaw`SELECT 1`;
      // Trae datos
      return await prisma.asset.findMany({
        select: {
          ...baseSelect,
          // Si prefieres sin relaciones, comenta estas dos líneas:
          category: { select: { idCategory: true, name: true, status: true } },
          headquarter: { select: { idHeadquarter: true, name: true, status: true } },
        },
      });
    } catch (e) {
      // Propaga con contexto
      throw new Error(`[AssetsRepository.list] ${e.message}`);
    }
  },

  findById: (idAsset) =>
    prisma.asset.findUnique({
      where: { idAsset: Number(idAsset) },
      select: baseSelect,
    }),

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
};

module.exports = { AssetsRepository };
