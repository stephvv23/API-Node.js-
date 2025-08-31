// Ajusta este require según dónde tengas el PrismaClient.
// Si usas src/lib/prisma.js:
let prisma = require('../../../lib/prisma.js');

const HeadquarterRepository = {
  listActive: () =>
    prisma.headquarter.findMany({
      where: { status: 'active' }, // ajusta si tu status es boolean/enum diferente
      select: {
        idHeadquarter: true,
        name: true
      }
    })
};

module.exports = { HeadquarterRepository };
