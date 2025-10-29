const { PhoneSurvivorRepository } = require('./phoneSurvivor.repository');

const PhoneSurvivorService = {
  /**
   * Get all phones for a survivor
   * @param {number} idSurvivor - Survivor ID
   */
  getBySurvivor: async (idSurvivor) => {
    return PhoneSurvivorRepository.getBySurvivor(idSurvivor);
  },

  /**
   * Get a specific phone-survivor relation
   */
  findOne: async (idSurvivor, idPhone) => {
    return PhoneSurvivorRepository.findOne(idSurvivor, idPhone);
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
   * Remove a phone from a survivor (hard delete)
   */
  delete: async (idSurvivor, idPhone) => {
    return PhoneSurvivorRepository.delete(idSurvivor, idPhone);
  }
};

module.exports = { PhoneSurvivorService };
