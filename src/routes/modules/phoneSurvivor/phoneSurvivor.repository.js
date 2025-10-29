const prisma = require('../../../lib/prisma');

const PhoneSurvivorRepository = {
  /**
   * Get all phones for a survivor
   * @param {number} idSurvivor - Survivor ID
   * @returns {Promise<Array>} List of phone-survivor relations
   */
  getBySurvivor: (idSurvivor) => {
    return prisma.phoneSurvivor.findMany({
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
      },
      orderBy: {
        idPhone: 'desc'
      }
    });
  },

  /**
   * Find a specific phone-survivor relation
   * @param {number} idSurvivor - Survivor ID
   * @param {number} idPhone - Phone ID
   * @returns {Promise<Object|null>} Phone-survivor relation or null
   */
  findOne: (idSurvivor, idPhone) =>
    prisma.phoneSurvivor.findUnique({
      where: {
        idPhone_idSurvivor: {
          idPhone: Number(idPhone),
          idSurvivor: Number(idSurvivor)
        }
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
   * Delete (hard delete) a phone-survivor relation
   * @param {number} idSurvivor - Survivor ID
   * @param {number} idPhone - Phone ID
   * @returns {Promise<Object>} Deleted phone-survivor relation
   */
  delete: (idSurvivor, idPhone) =>
    prisma.phoneSurvivor.delete({
      where: {
        idPhone_idSurvivor: {
          idPhone: Number(idPhone),
          idSurvivor: Number(idSurvivor)
        }
      }
    })
};

module.exports = { PhoneSurvivorRepository };
