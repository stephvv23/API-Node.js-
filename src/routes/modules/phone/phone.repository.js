const prisma = require('../../../lib/prisma');

const PhoneRepository = {
  /**
   * Get all phones
   * @returns {Promise<Array>} List of all phones
   */
  findAll: () =>
    prisma.phone.findMany({
      select: {
        idPhone: true,
        phone: true
      },
      orderBy: {
        idPhone: 'desc'
      }
    }),

  /**
   * Get a phone by ID
   * @param {number} idPhone - Phone ID
   * @returns {Promise<Object|null>} Phone or null
   */
  findById: (idPhone) =>
    prisma.phone.findUnique({
      where: { idPhone: Number(idPhone) },
      select: {
        idPhone: true,
        phone: true
      }
    }),

  /**
   * Find a phone by phone number
   * @param {number} phoneNumber - Phone number to search
   * @returns {Promise<Object|null>} Phone or null
   */
  findByPhoneNumber: (phoneNumber) =>
    prisma.phone.findFirst({
      where: { phone: Number(phoneNumber) },
      select: {
        idPhone: true,
        phone: true
      }
    }),

  /**
   * Create a new phone
   * @param {number} phoneNumber - Phone number
   * @returns {Promise<Object>} Created phone
   */
  create: (phoneNumber) =>
    prisma.phone.create({
      data: {
        phone: Number(phoneNumber)
      },
      select: {
        idPhone: true,
        phone: true
      }
    })
};

module.exports = { PhoneRepository };
