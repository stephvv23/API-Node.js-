const { PhoneSurvivorRepository } = require('./phoneSurvivor.repository');

const PhoneSurvivorService = {
  /**
   * Get the phone for a survivor (only one allowed)
   * @param {number} idSurvivor - Survivor ID
   * @returns {Promise<Object|null>} Phone-survivor relation or null
   */
  getBySurvivor: async (idSurvivor) => {
    return PhoneSurvivorRepository.getBySurvivor(idSurvivor);
  },

  /**
   * Add a phone to a survivor
   * @param {number} idSurvivor - Survivor ID
   * @param {number} idPhone - Phone ID
   */
  create: async (idSurvivor, idPhone) => {
    return PhoneSurvivorRepository.create(idSurvivor, idPhone);
  },

  /**
   * Delete all phone relations for a survivor
   */
  deleteAllBySurvivor: async (idSurvivor) => {
    return PhoneSurvivorRepository.deleteAllBySurvivor(idSurvivor);
  }
};

module.exports = { PhoneSurvivorService };

