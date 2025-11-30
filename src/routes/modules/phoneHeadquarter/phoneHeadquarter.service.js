const { PhoneHeadquarterRepository } = require('./phoneHeadquarter.repository');

const PhoneHeadquarterService = {
  /**
   * Get the phone for a headquarter (only one allowed)
   * @param {number} idHeadquarter - Headquarter ID
   * @returns {Promise<Object|null>} Phone-headquarter relation or null
   */
  getByHeadquarter: async (idHeadquarter) => {
    return PhoneHeadquarterRepository.getByHeadquarter(idHeadquarter);
  },

  /**
   * Add a phone to a headquarter
   * @param {number} idHeadquarter - Headquarter ID
   * @param {number} idPhone - Phone ID
   */
  create: async (idHeadquarter, idPhone) => {
    return PhoneHeadquarterRepository.create(idHeadquarter, idPhone);
  },

  /**
   * Delete all phone relations for a headquarter
   */
  deleteAllByHeadquarter: async (idHeadquarter) => {
    return PhoneHeadquarterRepository.deleteAllByHeadquarter(idHeadquarter);
  }
};

module.exports = { PhoneHeadquarterService };
