const prisma = require('../../../lib/prisma');

const PhoneVolunteerRepository = {
  /**
   * Get the phone for a volunteer (only one allowed)
   * @param {number} idVolunteer - Volunteer ID
   * @returns {Promise<Object|null>} Phone-volunteer relation or null
   */
  getByVolunteer: (idVolunteer) => {
    return prisma.phoneVolunteer.findFirst({
      where: { idVolunteer: Number(idVolunteer) },
      select: {
        idPhone: true,
        idVolunteer: true,
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
   * Create a phone-volunteer relation
   * @param {number} idVolunteer - Volunteer ID
   * @param {number} idPhone - Phone ID
   * @returns {Promise<Object>} Created phone-volunteer relation
   */
  create: (idVolunteer, idPhone) =>
    prisma.phoneVolunteer.create({
      data: {
        idVolunteer: Number(idVolunteer),
        idPhone: Number(idPhone)
      },
      select: {
        idPhone: true,
        idVolunteer: true,
        phone: {
          select: {
            idPhone: true,
            phone: true
          }
        }
      }
    }),

  /**
   * Delete all phone relations for a volunteer
   * @param {number} idVolunteer - Volunteer ID
   * @returns {Promise<Object>} Batch delete result
   */
  deleteAllByVolunteer: (idVolunteer) =>
    prisma.phoneVolunteer.deleteMany({
      where: { idVolunteer: Number(idVolunteer) }
    })
};

module.exports = { PhoneVolunteerRepository };
