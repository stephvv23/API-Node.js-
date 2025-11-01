const { EmergencyContactSurvivorRepository } = require('./emergencyContactSurvivor.repository');

const EmergencyContactSurvivorService = {
  /**
   * Get all emergency contacts for a survivor
   * @param {number} idSurvivor - Survivor ID
   * @param {Object} options - Pagination options { take, skip }
   */
  getBySurvivor: async (idSurvivor, options = {}) => {
    return EmergencyContactSurvivorRepository.getBySurvivor(idSurvivor, options);
  },

  /**
   * Get a specific emergency contact-survivor relation
   */
  findOne: async (idSurvivor, idEmergencyContact) => {
    return EmergencyContactSurvivorRepository.findOne(idSurvivor, idEmergencyContact);
  },

  /**
   * Add an emergency contact to a survivor
   * @param {number} idSurvivor - Survivor ID
   * @param {number} idEmergencyContact - Emergency Contact ID
   */
  create: async (idSurvivor, idEmergencyContact) => {
    return EmergencyContactSurvivorRepository.create(idSurvivor, idEmergencyContact);
  },

  /**
   * Remove an emergency contact from a survivor (hard delete)
   */
  delete: async (idSurvivor, idEmergencyContact) => {
    return EmergencyContactSurvivorRepository.delete(idSurvivor, idEmergencyContact);
  }
};

module.exports = { EmergencyContactSurvivorService };
