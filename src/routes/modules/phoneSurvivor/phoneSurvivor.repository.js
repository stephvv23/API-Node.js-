const prisma = require('../../../lib/prisma');

const PhoneSurvivorRepository = {
  /**
   * Get the phone for a survivor (only one allowed)
   * @param {number} idSurvivor - Survivor ID
   * @returns {Promise<Object|null>} Phone-survivor relation or null
   */
  getBySurvivor: (idSurvivor) => {
    return prisma.phoneSurvivor.findFirst({
      where: { idSurvivor: Number(idSurvivor) },
      select: {
        idPhone: true,
        idSurvivor: true,
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
   * Create a phone-survivor relation
   * @param {number} idSurvivor - Survivor ID
   * @param {number} idPhone - Phone ID
   * @returns {Promise<Object>} Created phone-survivor relation
   */
  create: (idSurvivor, idPhone) =>
    prisma.phoneSurvivor.create({
      data: {
        idSurvivor: Number(idSurvivor),
        idPhone: Number(idPhone)
      },
      select: {
        idPhone: true,
        idSurvivor: true,
        phone: {
          select: {
            idPhone: true,
            phone: true
          }
        }
      }
    }),

  /**
   * Delete all phone relations for a survivor
   * @param {number} idSurvivor - Survivor ID
   * @returns {Promise<Object>} Batch delete result
   */
  deleteAllBySurvivor: (idSurvivor) =>
    prisma.phoneSurvivor.deleteMany({
      where: { idSurvivor: Number(idSurvivor) }
    })
};

module.exports = { PhoneSurvivorRepository };

