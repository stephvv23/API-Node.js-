const prisma = require('../../lib/prisma.js');

const HeadquarterRepository = {
  listActive: () =>
    prisma.Headquarter.findMany({
      where: { status: 'active' },
      select: {
        idHeadquarter: true,
        name: true
      }
    })
};

module.exports = { HeadquarterRepository };
