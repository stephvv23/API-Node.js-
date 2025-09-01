const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const AssetsRepository = {
  list: () => prisma.asset.findMany({
    include: { category: true, headquarter: true }
  }),
  findById: (idAsset) => prisma.asset.findUnique({
    where: { idAsset: Number(idAsset) },
    include: { category: true, headquarter: true }
  }),
  create: (data) => prisma.asset.create({ data }),
  update: (idAsset, data) => prisma.asset.update({
    where: { idAsset: Number(idAsset) },
    data
  }),
  remove: (idAsset) => prisma.asset.delete({
    where: { idAsset: Number(idAsset) }
  }),
};

module.exports = { AssetsRepository };