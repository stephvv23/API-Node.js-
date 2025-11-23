const prisma = require('../../../lib/prisma');

const PhoneGodparentRepository = {
  /**
   * Get the phone for a godparent (only one allowed)
   * @param {number} idGodparent - Godparent ID
   * @returns {Promise<Object|null>} Phone-godparent relation or null
   */
  getByGodparent: (idGodparent) => {
  return prisma.phoneGodparent.findFirst({
      where: { idGodparent: Number(idGodparent) },
      select: {
        idPhone: true,
        idGodparent: true,
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
   * Create a phone-godparent relation
   * @param {number} idGodparent - Godparent ID
   * @param {number} idPhone - Phone ID
   * @returns {Promise<Object>} Created phone-godparent relation
   */
  create: (idGodparent, idPhone) =>
  prisma.phoneGodparent.create({
      data: {
        idGodparent: Number(idGodparent),
        idPhone: Number(idPhone)
      },
      select: {
        idPhone: true,
        idGodparent: true,
        phone: {
          select: {
            idPhone: true,
            phone: true
          }
        }
      }
    }),

  /**
   * Delete all phone relations for a godparent
   * @param {number} idGodparent - Godparent ID
   * @returns {Promise<Object>} Batch delete result
   */
  deleteAllByGodparent: (idGodparent) =>
  prisma.phoneGodparent.deleteMany({
      where: { idGodparent: Number(idGodparent) }
    })
};

module.exports = { PhoneGodparentRepository };
