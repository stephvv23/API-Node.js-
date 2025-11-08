const prisma = require('../../../lib/prisma');

const PhoneHeadquarterRepository = {
  /**
   * Get the phone for a headquarter (only one allowed)
   * @param {number} idHeadquarter - Headquarter ID
   * @returns {Promise<Object|null>} Phone-headquarter relation or null
   */
  getByHeadquarter: (idHeadquarter) => {
    return prisma.phoneHeadquarter.findFirst({
      where: { idHeadquarter: Number(idHeadquarter) },
      select: {
        idPhone: true,
        idHeadquarter: true,
        phone: {
          select: {
            idPhone: true,
            phone: true
          }
        }
      }
    });
  },

  /**
   * Create a phone-headquarter relation
   * @param {number} idHeadquarter - Headquarter ID
   * @param {number} idPhone - Phone ID
   * @returns {Promise<Object>} Created phone-headquarter relation
   */
  create: (idHeadquarter, idPhone) =>
    prisma.phoneHeadquarter.create({
      data: {
        idHeadquarter: Number(idHeadquarter),
        idPhone: Number(idPhone)
      },
      select: {
        idPhone: true,
        idHeadquarter: true,
        phone: {
          select: {
            idPhone: true,
            phone: true
          }
        }
      }
    }),

  /**
   * Delete all phone relations for a headquarter
   * @param {number} idHeadquarter - Headquarter ID
   * @returns {Promise<Object>} Batch delete result
   */
  deleteAllByHeadquarter: (idHeadquarter) =>
    prisma.phoneHeadquarter.deleteMany({
      where: { idHeadquarter: Number(idHeadquarter) }
    })
};

module.exports = { PhoneHeadquarterRepository };
