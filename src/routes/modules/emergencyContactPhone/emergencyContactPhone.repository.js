const prisma = require('../../../lib/prisma');

const EmergencyContactPhoneRepository = {
  /**
   * Get the phone for an emergency contact (only one allowed)
   * @param {number} idEmergencyContact - Emergency Contact ID
   * @returns {Promise<Object|null>} Phone-emergency contact relation or null
   */
  getByEmergencyContact: (idEmergencyContact) => {
    return prisma.phoneEmergencyContact.findFirst({
      where: { idEmergencyContact: Number(idEmergencyContact) },
      select: {
        idPhone: true,
        idEmergencyContact: true,
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
   * Create a phone-emergency contact relation
   * @param {number} idEmergencyContact - Emergency Contact ID
   * @param {number} idPhone - Phone ID
   * @returns {Promise<Object>} Created phone-emergency contact relation
   */
  create: (idEmergencyContact, idPhone) =>
    prisma.phoneEmergencyContact.create({
      data: {
        idEmergencyContact: Number(idEmergencyContact),
        idPhone: Number(idPhone)
      },
      select: {
        idPhone: true,
        idEmergencyContact: true,
        phone: {
          select: {
            idPhone: true,
            phone: true
          }
        }
      }
    }),

  /**
   * Delete all phone relations for an emergency contact
   * @param {number} idEmergencyContact - Emergency Contact ID
   * @returns {Promise<Object>} Batch delete result
   */
  deleteAllByEmergencyContact: (idEmergencyContact) =>
    prisma.phoneEmergencyContact.deleteMany({
      where: { idEmergencyContact: Number(idEmergencyContact) }
    })
};

module.exports = { EmergencyContactPhoneRepository };
